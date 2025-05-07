"use client";

import { useState } from "react";
import Tesseract from "tesseract.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Add categories list
const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing",
  "Entertainment",
  "Shopping",
  "Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Groceries",
  "Subscriptions",
  "Personal Care",
  "Gifts & Donations",
  "Other"
] as const;

// Use API key only on the client side
const getGeminiAPI = () => {
  try {
    // Only initialize on client side
    if (typeof window === 'undefined') return null;
    
    const apiKey = 'AIzaSyDv0lxLAJMDoIwGkvKv-xViTnE8kIkuViw';
    if (!apiKey) return null;
    
    return new GoogleGenerativeAI(apiKey);
  } catch (error) {
    console.error("Error initializing Gemini AI:", error);
    return null;
  }
};

type ReceiptScannerProps = {
  onClose: () => void;
  onScanComplete: (data: {
    amount: number;
    category: string;
    date: string;
    description: string;
  }) => void;
};

export function ReceiptScanner({ onClose, onScanComplete }: ReceiptScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const [extractedData, setExtractedData] = useState<{
    amount: string;
    category: string;
    date: string;
    description: string;
  }>({
    amount: "",
    category: "",
    date: "",
    description: "",
  });

  const parseAmounts = (text: string) => {
    // Look for amounts in the format ₹XX.XX or ₹XX
    const amountRegex = /₹?\s*(\d+(?:\.\d{1,2})?)/g;
    const matches = [];
    let match;
    
    while ((match = amountRegex.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      if (!isNaN(value)) {
        matches.push({
          value,
          index: match.index,
          length: match[0].length
        });
      }
    }
    
    return matches;
  };

  // Move Gemini initialization inside component
  const processWithGemini = async (text: string) => {
    const genAI = getGeminiAPI();
    
    if (!genAI) {
      toast({
        title: "Configuration Error",
        description: "Gemini API is not properly configured. Some features may be limited.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `Extract the following information from this receipt text:
        - The total amount (just the number)
        - The date in YYYY-MM-DD format
        - The store or merchant name
        - The main items purchased

        Receipt text:
        ${text}

        Return ONLY a JSON object with these fields:
        {
          "amount": number,
          "date": "YYYY-MM-DD",
          "category": "one of: Food & Dining, Transportation, Housing, Entertainment, Shopping, Utilities, Healthcare, Travel, Education, Groceries, Subscriptions, Personal Care, Gifts & Donations, Other",
          "description": "store name and main items"
        }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      try {
        return JSON.parse(response.text());
      } catch (error) {
        console.error("Failed to parse Gemini response:", error);
        return null;
      }
    } catch (error) {
      console.error("Gemini processing error:", error);
      return null;
    }
  };

  const preprocessImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Increase resolution for better OCR
        const MAX_WIDTH = 2500;
        const MAX_HEIGHT = 2500;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and enhance the image
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Enhanced image processing
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale with better contrast
          const avg = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11);
          // Increase contrast
          const contrast = 1.5; // Adjust contrast factor
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const color = factor * (avg - 128) + 128;
          
          // Thresholding for better text recognition
          const final = color > 160 ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = final;
        }
        
        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Could not create blob from canvas'));
        }, 'image/png', 1.0);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const extractInformation = (text: string) => {
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line.replace(/\s+/g, ' '));

    console.log('Processing lines:', lines);

    let amount = '';
    let date = '';
    let description = '';
    let category = '';

    // Find date - Look for common date formats
    const datePatterns = [
      /Date\s*[:.]?\s*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,  // Date: DD/MM/YY
      /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/,  // DD/MM/YY or DD-MM-YYYY
      /(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})/,     // YYYY/MM/DD
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          const rawDate = match[1];
          // Convert the date to YYYY-MM-DD format
          try {
            let [d, m, y] = rawDate.split(/[-/.]/);
            
            // Handle 2-digit year
            if (y.length === 2) {
              y = '20' + y; // Assume 20xx for two-digit years
            }
            
            // Ensure month and day are two digits
            d = d.padStart(2, '0');
            m = m.padStart(2, '0');
            
            // Validate components
            const yearNum = parseInt(y);
            const monthNum = parseInt(m);
            const dayNum = parseInt(d);
            
            if (yearNum >= 2000 && yearNum <= 2100 &&
                monthNum >= 1 && monthNum <= 12 &&
                dayNum >= 1 && dayNum <= 31) {
              date = `${y}-${m}-${d}`;
              break;
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        }
      }
      if (date) break;
    }

    // Determine category based on items and keywords
    const categoryKeywords: Record<string, string[]> = {
      "Food & Dining": [
        "restaurant", "cafe", "food", "meal", "dinner", "lunch", "breakfast",
        "biryani", "chicken", "mutton", "drinks", "soft drinks", "bottle",
        "crispy", "dish", "dining", "dine", "maarhaba", "kashmiri", "menu",
        "corn", "rice", "naan", "roti", "curry"
      ],
      "Groceries": ["grocery", "supermarket", "market", "fruits", "vegetables", "mart"],
      "Shopping": ["mall", "store", "retail", "clothes", "clothing", "fashion"],
      "Transportation": ["taxi", "uber", "cab", "fare", "metro", "bus", "train"],
      "Entertainment": ["movie", "theatre", "cinema", "show", "event"],
      "Utilities": ["bill", "utility", "electricity", "water", "gas"],
      "Healthcare": ["medical", "hospital", "doctor", "pharmacy", "medicine"],
    };

    // Collect all relevant words from the receipt
    const words = lines.join(' ').toLowerCase().split(/\s+/);
    const categoryScores: Record<string, number> = {};

    // Score each category based on keyword matches
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      categoryScores[category] = 0;
      for (const keyword of keywords) {
        if (words.some(word => word.includes(keyword))) {
          categoryScores[category]++;
        }
      }
    }

    // Find the category with the highest score
    let maxScore = 0;
    for (const [cat, score] of Object.entries(categoryScores)) {
      if (score > maxScore) {
        maxScore = score;
        category = cat;
      }
    }

    // Set default category if none found
    if (!category) {
      category = "Other";
    }

    // Find all numbers in the text that could be amounts
    const allAmounts: number[] = [];
    const amountLines: { amount: number, lineIndex: number }[] = [];
    
    lines.forEach((line, index) => {
      // Skip obvious non-amount lines
      if (line.toLowerCase().match(/phone|contact|gstin|bill\s*no|invoice/i)) {
        return;
      }

      // Look for numbers that might be amounts
      const matches = line.match(/(?:Rs\.?|₹)?\s*(\d+(?:[.,]\d{1,2})?)/g);
      if (matches) {
        matches.forEach(match => {
          // Clean the match of currency symbols and spaces
          const cleanMatch = match.replace(/[Rs\.₹\s]/g, '');
          // Replace comma with decimal point if it appears to be a decimal separator
          const normalizedMatch = cleanMatch.includes(',') ? 
            cleanMatch.replace(/,(\d{2})$/, '.$1') : cleanMatch;
          
          const value = parseFloat(normalizedMatch);
          if (!isNaN(value) && value > 0) {
            allAmounts.push(value);
            amountLines.push({ amount: value, lineIndex: index });
          }
        });
      }
    });

    // Sort amounts in descending order
    const sortedAmounts = [...allAmounts].sort((a, b) => b - a);

    // First try to find explicit total amounts
    const totalKeywords = ['total', 'sub total', 'grand total', 'amount'];
    let foundTotal = false;

    // Check the last few lines for total amount
    const lastFewLines = lines.slice(-5);
    for (let i = lastFewLines.length - 1; i >= 0; i--) {
      const line = lastFewLines[i].toLowerCase();
      if (totalKeywords.some(keyword => line.includes(keyword))) {
        const matches = line.match(/(\d+(?:[.,]\d{1,2})?)/g);
        if (matches) {
          const value = parseFloat(matches[matches.length - 1].replace(/,/g, ''));
          if (!isNaN(value) && value > 0) {
            amount = value.toFixed(2);
            foundTotal = true;
            break;
          }
        }
      }
    }

    // If no explicit total found, look for the largest amount at the bottom
    // that could reasonably be a total
    if (!foundTotal && sortedAmounts.length > 0) {
      const bottomAmounts = amountLines
        .filter(({ lineIndex }) => lineIndex >= lines.length - 5)
        .map(({ amount }) => amount)
        .sort((a, b) => b - a);

      if (bottomAmounts.length > 0) {
        amount = bottomAmounts[0].toFixed(2);
      }
    }

    // If still no amount found, use the largest reasonable amount
    if (!amount && sortedAmounts.length > 0) {
      amount = sortedAmounts[0].toFixed(2);
    }

    return {
      amount,
      date: date || new Date().toISOString().split('T')[0],
      description: "",  // Leave description empty for user to fill
      category: category || "Other"
    };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const processedImage = await preprocessImage(file);
      
      toast({
        title: "Processing Receipt",
        description: "Extracting text from image...",
      });
      
      // Update Tesseract options
      const result = await Tesseract.recognize(processedImage, "eng", {
        logger: m => {
          if (m.status === "recognizing text") {
            toast({
              title: "Processing Receipt",
              description: `Progress: ${(m.progress * 100).toFixed(0)}%`,
            });
          }
        }
      });

      console.log('Raw OCR Text:', result.data.text);

      // Extract information from OCR text
      const extracted = extractInformation(result.data.text);
      console.log('Extracted data:', extracted);

      setExtractedData({
        amount: extracted.amount,
        category: extracted.category,
        date: extracted.date,
        description: extracted.description,
      });

      toast({
        title: "Receipt Processed",
        description: "Please verify the extracted information.",
      });

    } catch (error) {
      console.error("Error processing receipt:", error);
      toast({
        title: "Processing Error",
        description: "Please fill in the fields manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = () => {
    onScanComplete({
      amount: parseFloat(extractedData.amount) || 0,
      category: extractedData.category || "Other",
      date: extractedData.date || new Date().toISOString().split('T')[0],
      description: extractedData.description || ""
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Receipt Scanner</DialogTitle>
          <DialogDescription>Upload a receipt to automatically extract expense details</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Receipt Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <label
                  htmlFor="receipt-upload"
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Click here to upload a receipt image
                  </p>
                </label>
                {previewUrl && (
                  <div className="mt-4">
                    <img src={previewUrl} alt="Receipt preview" className="max-w-full rounded-lg" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Extracted Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={extractedData.amount}
                        onChange={(e) => setExtractedData(prev => ({ ...prev, amount: e.target.value }))}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={extractedData.category}
                      onValueChange={(value) => setExtractedData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={extractedData.date}
                      onChange={(e) => setExtractedData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={extractedData.description}
                      onChange={(e) => setExtractedData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter purchase details"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isProcessing || !previewUrl}>
              Use Data
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
