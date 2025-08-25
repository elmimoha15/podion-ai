/**
 * Paddle API service for subscription management
 * Handles Paddle.js overlay checkout and subscription management
 */

import { auth } from '../lib/firebase';

// Paddle.js types based on official documentation
declare global {
  interface Window {
    Paddle: {
      Environment: {
        set: (environment: string) => void;
      };
      Initialize: (config: { 
        token: string;
        eventCallback?: (data: any) => void; // Global event callback for all Paddle events
      }) => void;
      Checkout: {
        open: (options: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: { email?: string };
          customData?: Record<string, any>;
          settings?: {
            successUrl?: string;
            closeCheckoutOnSuccess?: boolean;
            allowLogout?: boolean;
            theme?: string;
            locale?: string;
          };
        }) => void;
        close: () => void; // Official Paddle.Checkout.close() method
      };
    };
  }
}

export interface PaddleCheckoutRequest {
  plan_id: string;
  success_url?: string;
  cancel_url?: string;
}

export interface PaddleCheckoutResponse {
  success: boolean;
  checkout_url?: string;
  session_id?: string;
  plan_config?: {
    name: string;
    price: number;
    currency: string;
    description: string;
    features: string[];
  };
  error?: string;
}

export interface PaddleSubscription {
  user_id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  paddle_subscription_id?: string;
  paddle_customer_id?: string;
  paddle_transaction_id?: string;
  price_id: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  created_at: string;
  updated_at: string;
  next_billing_date?: string;
  trial_end_date?: string;
  canceled_at?: string;
  expires_at?: string;
}

export interface PaddleSubscriptionResponse {
  success: boolean;
  subscription?: PaddleSubscription;
  error?: string;
}

export interface PaddlePlansResponse {
  success: boolean;
  plans?: {
    [key: string]: {
      name: string;
      price_id: string;
      price: number;
      currency: string;
      description: string;
      features: string[];
    };
  };
  error?: string;
}

class PaddleApiService {
  private baseUrl = this.getApiBaseUrl();
  
  private getApiBaseUrl(): string {
    // Check if we're in development (localhost) or production
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1/paddle';
    }
    
    // For production, we'll disable backend calls for now since backend isn't deployed
    // You can update this to your deployed backend URL when available
    return '';
  }
  
  private isBackendAvailable(): boolean {
    return this.baseUrl !== '';
  }

  /**
   * Get authentication headers for API requests
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const idToken = await user.getIdToken();
    return {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Initialize Paddle.js with global event callback (call this once when app loads)
   */
  initializePaddle(): void {
    if (typeof window !== 'undefined' && window.Paddle) {
      try {
        // Set environment to sandbox for testing
        window.Paddle.Environment.set('sandbox');
        
        // Initialize with client-side token and global event callback
        // Updated with new Paddle client-side token from Paddle Dashboard
        // Get it from: https://vendors.paddle.com/authentication
        const paddleToken = 'test_599bd32d099ba6bbbe169a021a7';
        
        if (!paddleToken || paddleToken.startsWith('test_')) {
          console.warn('⚠️ Using sandbox Paddle token.');
        }
        
        window.Paddle.Initialize({
          token: paddleToken,
          // Global event callback to handle all Paddle events
          eventCallback: (data: any) => {
            console.log('Paddle global event received:', data);
            
            // Handle checkout completion - this is the key event we need
            if (data.name === 'checkout.completed') {
              console.log('🎉 Checkout completed! Closing modal and redirecting...');
              
              // Extract plan information from the event data or localStorage
              const planId = localStorage.getItem('paddle_checkout_plan') || 'starter';
              
              // Close the Paddle modal using official method
              setTimeout(() => {
                try {
                  window.Paddle.Checkout.close();
                  console.log('Paddle modal closed using official method');
                } catch (error) {
                  console.error('Error closing Paddle modal:', error);
                }
              }, 1000); // Wait 1 second to show success message
              
              // Redirect to next onboarding step after modal closes
              setTimeout(() => {
                // Clean up localStorage
                localStorage.removeItem('paddle_checkout_plan');
                localStorage.removeItem('paddle_checkout_timestamp');
                localStorage.removeItem('onboarding_payment_context');
                
                // Trigger onboarding continuation event
                window.dispatchEvent(new CustomEvent('paddlePaymentSuccess', {
                  detail: { planId: planId }
                }));
                
                console.log('Onboarding continuation triggered for plan:', planId);
              }, 1500); // Wait for modal to close first
            }
            
            // Handle checkout closure
            if (data.name === 'checkout.closed') {
              console.log('Paddle checkout modal closed');
            }
            
            // Handle errors
            if (data.name === 'checkout.error') {
              console.error('Paddle checkout error:', data);
            }
          }
        });
        
        console.log('Paddle initialized successfully with global event callback');
      } catch (error) {
        console.error('Failed to initialize Paddle:', error);
      }
    } else {
      console.warn('Paddle.js not loaded or window not available');
    }
  }

  /**
   * Open Paddle overlay checkout (correct approach per Paddle docs)
   */
  async openPaddleCheckout(planId: string): Promise<PaddleCheckoutResponse> {
    try {
      if (typeof window === 'undefined' || !window.Paddle) {
        throw new Error('Paddle.js not loaded');
      }

      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Map plan IDs to Paddle price IDs
      const priceIdMap: Record<string, string> = {
        'starter': 'pri_01k361dv20d9j4prp20kddnra1',
        'pro': 'pri_01k361efwxa954axxmjnc1vmns',
        'elite': 'pri_01k361f4zw7y10rpdzt0m7kcdv'
      };

      const priceId = priceIdMap[planId];
      if (!priceId) {
        throw new Error(`Invalid plan ID: ${planId}`);
      }

      // Store plan info for success detection
      localStorage.setItem('paddle_checkout_plan', planId);
      localStorage.setItem('paddle_checkout_timestamp', Date.now().toString());
      
      // Set up polling to detect payment success
      const pollForSuccess = () => {
        const checkSuccess = () => {
          // Check if payment was successful (Paddle sets success indicators)
          const paddleSuccess = localStorage.getItem('paddle_payment_success');
          const onboardingContext = localStorage.getItem('onboarding_payment_context');
          
          if (paddleSuccess === 'true' && onboardingContext === 'true') {
            console.log('🎉 Paddle payment success detected!');
            
            // Clear success flag
            localStorage.removeItem('paddle_payment_success');
            
            // Dispatch success event for onboarding
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('paddlePaymentSuccess', {
                detail: { planId: planId }
              }));
            }, 500);
            
            return true; // Stop polling
          }
          
          return false; // Continue polling
        };
        
        // Poll every 1 second for up to 5 minutes
        let attempts = 0;
        const maxAttempts = 300; // 5 minutes
        
        const interval = setInterval(() => {
          attempts++;
          
          if (checkSuccess() || attempts >= maxAttempts) {
            clearInterval(interval);
          }
        }, 1000);
      };
      
      // Start polling if in onboarding context
      const onboardingContext = localStorage.getItem('onboarding_payment_context');
      if (onboardingContext === 'true') {
        pollForSuccess();
      }

      // Open Paddle overlay checkout - events handled by global eventCallback in Paddle.Initialize()
      const checkoutOptions = {
        items: [{
          priceId: priceId,
          quantity: 1
        }],
        customer: user.email ? {
          email: user.email
        } : undefined,
        customData: {
          user_id: user.uid,
          plan_id: planId
        }
      };
      
      window.Paddle.Checkout.open(checkoutOptions);
      
      // Note: Using official Paddle.Checkout.close() method in eventCallback above

      // Store the plan ID in localStorage for success handling
      localStorage.setItem('paddle_checkout_plan', planId);
      localStorage.setItem('paddle_checkout_timestamp', Date.now().toString());

      console.log('Paddle checkout opened for plan:', planId);

      return {
        success: true,
        checkout_url: 'paddle_overlay_opened'
      };
    } catch (error) {
      console.error('Error opening Paddle checkout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Legacy method - now redirects to Paddle.js overlay
   */
  async createCheckoutSession(request: PaddleCheckoutRequest): Promise<PaddleCheckoutResponse> {
    return this.openPaddleCheckout(request.plan_id);
  }

  /**
   * Get current user's subscription
   */
  async getUserSubscription(): Promise<PaddleSubscriptionResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/subscription`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get subscription'
      };
    }
  }

  /**
   * Get real Paddle invoices for the current user
   */
  async getUserInvoices(limit: number = 10): Promise<any> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${this.getApiBaseUrl()}/api/paddle/invoices?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Paddle invoices fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching Paddle invoices:', error);
      throw error;
    }
  }

  /**
   * Cancel current user's subscription
   */
  async cancelSubscription(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/subscription`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cancel subscription'
      };
    }
  }

  /**
   * Get available subscription plans
   */
  async getAvailablePlans(): Promise<PaddlePlansResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(
        `${this.baseUrl}/plans`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting available plans:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get plans'
      };
    }
  }

  /**
   * Redirect user to Paddle checkout
   */
  redirectToCheckout(checkoutUrl: string): void {
    window.location.href = checkoutUrl;
  }

  /**
   * Open Paddle checkout in a popup window
   */
  openCheckoutPopup(checkoutUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const popup = window.open(
        checkoutUrl,
        'paddle-checkout',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        resolve(false);
        return;
      }

      // Check if popup is closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          resolve(true);
        }
      }, 1000);

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        if (!popup.closed) {
          popup.close();
        }
        resolve(false);
      }, 10 * 60 * 1000);
    });
  }
}

// Export singleton instance
export const paddleApi = new PaddleApiService();
