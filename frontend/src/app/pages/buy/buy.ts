import { StoreFooter } from '../../components/store-footer/store-footer';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { StoreData } from '../../services/store-data';
import { I18nPipe } from '../../services/i18n.pipe';

type PaymentMethodId = 'cod' | 'stripe';
interface PaymentMethod { id: PaymentMethodId; label: string; }
interface PaymentMethodsResponse { methods: PaymentMethod[]; currency: string; simulated: boolean; }
interface PaymentStatusResponse {
  orderId: string;
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed';
  total: number;
  currency: string;
  simulated?: boolean;
}
interface OrderResponse { id: string; paymentMethod: PaymentMethodId; checkoutUrl?: string; }

@Component({
  selector: 'app-buy',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StoreFooter, I18nPipe],
  templateUrl: './buy.html',
  styleUrl: './buy.css'
})
export class Buy implements OnInit {
  readonly store = inject(StoreData);
  readonly name = signal('');
  readonly phone = signal('');
  readonly email = signal('');
  readonly address = signal('');
  readonly paymentMethods = signal<PaymentMethod[]>([{ id: 'cod', label: 'Phone confirmation · pay on delivery' }]);
  readonly paymentMethod = signal<PaymentMethodId>('cod');
  readonly currency = signal('EGP');
  readonly submitting = signal(false);
  readonly verifyingPayment = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly paymentCancelled = signal(false);
  readonly receipt = signal<PaymentStatusResponse | null>(null);

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  stripeAvailable(): boolean {
    return this.paymentMethods().some(method => method.id === 'stripe');
  }

  ngOnInit(): void {
    this.loadPaymentMethods();
    this.route.queryParamMap.subscribe(params => {
      const orderId = params.get('orderId');
      const sessionId = params.get('session_id');
      if (params.get('cancelled') === 'true') {
        this.paymentCancelled.set(true);
        this.success.set('');
        return;
      }
      if (orderId && sessionId) this.verifyPayment(orderId, sessionId);
    });
  }

  private loadPaymentMethods(): void {
    this.http.get<PaymentMethodsResponse>('/api/v1.0/payment-methods').subscribe({
      next: response => {
        this.paymentMethods.set(response.methods?.length ? response.methods : [{ id: 'cod', label: 'Phone confirmation · pay on delivery' }]);
        this.currency.set(response.currency || 'EGP');
        if (!this.paymentMethods().some(method => method.id === this.paymentMethod())) {
          this.paymentMethod.set('cod');
        }
      },
      error: () => {
        // Keep cash on delivery available if gateway discovery is temporarily unavailable.
        this.paymentMethods.set([{ id: 'cod', label: 'Phone confirmation · pay on delivery' }]);
        this.paymentMethod.set('cod');
      }
    });
  }

  private verifyPayment(orderId: string, sessionId: string): void {
    if (this.verifyingPayment()) return;
    this.verifyingPayment.set(true);
    this.error.set('');
    this.paymentCancelled.set(false);
    this.http.get<PaymentStatusResponse>(
      `/api/v1.0/orders/${encodeURIComponent(orderId)}/status`,
      { params: { session_id: sessionId } }
    ).subscribe({
      next: response => {
        this.currency.set(response.currency || this.currency());
        if (response.paymentStatus === 'paid') {
          this.store.clearCart();
          this.receipt.set(response);
          this.success.set(response.simulated
            ? 'Demo checkout completed. No real payment was charged.'
            : 'Your payment is confirmed. We will contact you to arrange delivery.');
        } else if (response.paymentStatus === 'failed') {
          this.error.set('This checkout session expired or failed. Your cart is still available. Please try again.');
        } else {
          this.error.set('Payment is still pending. Your cart has been kept; refresh this page to check again.');
        }
        this.verifyingPayment.set(false);
      },
      error: error => {
        this.error.set(error.error?.message || 'Could not verify the payment. Your cart has been kept.');
        this.verifyingPayment.set(false);
      }
    });
  }

  submitOrder(): void {
    if (this.submitting() || this.store.cart().length === 0) return;
    const name = this.name().trim();
    const phone = this.phone().trim();
    const email = this.email().trim();
    const address = this.address().trim();
    if (!name || !phone || !address) {
      this.error.set('Please enter your name, phone number, and delivery address.');
      return;
    }
    if (!/[0-9]{6,}/.test(phone.replace(/\D/g, ''))) {
      this.error.set('Please enter a valid phone number.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set('Please enter a valid email address.');
      return;
    }
    this.error.set('');
    this.success.set('');
    this.paymentCancelled.set(false);
    this.submitting.set(true);
    const order = {
      customer: { name, phone, address, ...(email ? { email } : {}) },
      paymentMethod: this.paymentMethod(),
      items: this.store.cart().map(item => ({ itemId: item._id, quantity: item.quantity }))
    };
    this.http.post<OrderResponse>('/api/v1.0/orders', order).subscribe({
      next: response => {
        if (response.paymentMethod === 'stripe' && response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
          return;
        }
        this.store.clearCart();
        this.name.set(''); this.phone.set(''); this.email.set(''); this.address.set('');
        this.success.set('Your order was submitted. Payment is due on delivery; we will call to confirm your order.');
        this.submitting.set(false);
      },
      error: err => {
        this.error.set(err.error?.message || 'We couldn’t submit your order. Please try again.');
        this.submitting.set(false);
      }
    });
  }
}
