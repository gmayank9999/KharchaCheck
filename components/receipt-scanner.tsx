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
      .map(line => line.replace(/\s+/g, ' ')); // normalize spaces

    console.log('Processing lines:', lines);

    let amount = '';
    let date = '';
    let merchant = '';
    let description = '';
    let category = 'Other';

    // Try to find merchant name (usually at the top)
    for (const line of lines) {
      if (line.includes('RESTAURANT') || line.includes('PRIVATE LIMITED') || 
          line.includes('PVT') || line.includes('LTD')) {
        merchant = line.trim();
        break;
      }
    }

    // Look for date with improved Indian date format detection
    const datePatterns = [
      /Date:?\s*(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/i,
      /Bill Date:?\s*(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/i,
      /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/,
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          let [_, day, month, year] = match;
          if (year.length === 2) year = '20' + year;
          day = day.padStart(2, '0');
          month = month.padStart(2, '0');
          date = `${year}-${month}-${day}`;
          break;
        }
      }
      if (date) break;
    }

    // Enhanced amount detection for restaurant/itemized receipts
    const amountPatterns = [
      // Look for explicit total markers
      /(?:grand\s+)?total\s*(?:amount)?[:.]?\s*(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /(?:sub\s*[-]?\s*)?total\s*[:.]?\s*(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /amount\s+payable[:.]?\s*(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /net\s+amount[:.]?\s*(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /to\s+pay[:.]?\s*(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i,
      /(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)\s*only/i,
    ];

    // Patterns to skip (non-total amounts)
    const skipPatterns = [
      /qty|quantity/i,
      /bill\s*no/i,
      /invoice\s*no/i,
      /item\s*no/i,
      /table\s*no/i,
      /gstin/i,
      /mobile|phone/i,
      /pin\s*code/i,
    ];

    // First find the highest amount in the receipt
    let highestAmount = 0;
    let foundExplicitTotal = false;

    // Process lines from bottom to top for totals
    const reversedLines = [...lines].reverse();
    for (const line of reversedLines) {
      const cleanLine = line.toLowerCase().trim();
      
      // Skip if line contains any of the skip patterns
      if (skipPatterns.some(pattern => pattern.test(cleanLine))) {
        continue;
      }

      // First try explicit total patterns
      for (const pattern of amountPatterns) {
        const match = line.match(pattern);
        if (match) {
          const value = parseFloat(match[1].replace(/,/g, ''));
          if (!isNaN(value) && value > 0) {
            amount = value.toFixed(2);
            foundExplicitTotal = true;
            break;
          }
        }
      }

      if (foundExplicitTotal) break;

      // If no explicit total, look for amounts at the bottom
      const numberMatches = line.match(/(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/g);
      if (numberMatches) {
        for (const match of numberMatches) {
          const value = parseFloat(match.replace(/[^0-9.]/g, ''));
          if (!isNaN(value) && value > highestAmount) {
            highestAmount = value;
            // Only update amount if it's significantly larger (likely to be the total)
            if (value > 100) {
              amount = value.toFixed(2);
            }
          }
        }
      }
    }

    // If we found a total explicitly, use that, otherwise use the highest amount
    if (!foundExplicitTotal && highestAmount > 0) {
      amount = highestAmount.toFixed(2);
    }

    // Enhanced category detection
    const lowerText = text.toLowerCase();
    if (lowerText.includes('restaurant') || lowerText.includes('cafe') || 
        lowerText.includes('food') || lowerText.includes('dining')) {
      category = 'Food & Dining';
    } else if (lowerText.includes('supermarket') || lowerText.includes('grocery') || 
               lowerText.includes('mart')) {
      category = 'Groceries';
    }

    // Build better description
    description = merchant ? 
      `Purchase from ${merchant.replace(/PRIVATE LIMITED|PVT\.?\s*LTD\.?/i, '').trim()}` : 
      'Store purchase';

    // Add items if found
    const items: string[] = [];
    let foundItems = false;
    for (const line of lines) {
      const cleanLine = line.toLowerCase();
      if (cleanLine.includes('qty') || cleanLine.includes('price') || cleanLine.includes('amount')) {
        foundItems = true;
        continue;
      }
      if (foundItems && /\d+\.\d{2}/.test(line) && !skipPatterns.some(pattern => pattern.test(cleanLine))) {
        const itemMatch = line.match(/([A-Za-z\s]+)/);
        if (itemMatch) {
          const item = itemMatch[1].trim();
          if (item.length > 2) items.push(item);
        }
      }
    }

    if (items.length > 0) {
      description += ` (Items: ${items.slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''})`;
    }

    console.log('Extracted data:', {
      amount,
      date,
      merchant,
      description,
      category,
      items
    });

    return {
      amount,
      date: date || new Date().toISOString().split('T')[0],
      description,
      category
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
