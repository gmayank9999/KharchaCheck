// Email service using Email.js
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
emailjs.init('rn8VzH0cCTYl_GDmr'); // Replace with your actual public key

interface EmailParams {
  to_email: string;
  subject: string;
  message: string;
  currentSpent?: number;
  budgetLimit?: number;
  remaining?: number;
  isOverBudget?: boolean;
}

export const sendEmail = async ({ 
  to_email, 
  subject, 
  message, 
  currentSpent, 
  budgetLimit, 
  remaining,
  isOverBudget 
}: EmailParams) => {
  try {    const templateParams = {
      to_name: to_email.split('@')[0], // Add recipient's name from email
      to_email: to_email, // This will be used in the template's "To Email" field
      subject,
      message,
      current_spent: currentSpent?.toLocaleString('en-IN', { 
        style: 'currency', 
        currency: 'INR' 
      }),
      budget_limit: budgetLimit?.toLocaleString('en-IN', { 
        style: 'currency', 
        currency: 'INR' 
      }),
      remaining: remaining?.toLocaleString('en-IN', { 
        style: 'currency', 
        currency: 'INR' 
      }),
      header_color: isOverBudget ? '#dc2626' : '#f59e0b',
      amount_color: isOverBudget ? '#dc2626' : '#3b82f6'
    };

    await emailjs.send(
      'service_tj3mcq4', // Replace with your EmailJS service ID
      'template_sr8nr7r', // Replace with your EmailJS template ID
      templateParams
    );

    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};
