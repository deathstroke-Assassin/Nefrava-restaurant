import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { I18nPipe } from '../../../services/i18n.pipe';
import { LocalizedText } from '../../../services/site-preferences';

interface OrderItem { itemId: string; name: string | LocalizedText; price: number; quantity: number; }
interface Customer { name: string; phone: string; address: string; email?: string; }
interface OrderNote { createdAt: string; description: string; }
type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed';
interface StripeDetails { sessionId?: string | null; paymentIntentId?: string | null; customerEmail?: string | null; }
interface Order {
  _id: string; customer: Customer; items: OrderItem[]; total: number;
  status: 'opened' | 'closed'; notes: OrderNote[]; createdAt: string; updatedAt: string;
  paymentMethod?: 'cod' | 'stripe'; paymentStatus?: PaymentStatus; stripeDetails?: StripeDetails;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, I18nPipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders implements OnInit {
  readonly orders = signal<Order[]>([]);
  readonly selectedOrder = signal<Order | null>(null);
  readonly selectedStatus = signal<'opened' | 'closed' | 'all'>('all');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly newNote = signal('');
  readonly emailSubject = signal('');
  readonly emailMessage = signal('');
  readonly sendingEmail = signal(false);
  readonly emailError = signal('');
  readonly emailSuccess = signal('');
  readonly filteredOrders = computed(() => {
    const status = this.selectedStatus();
    return status === 'all' ? this.orders() : this.orders().filter(order => order.status === status);
  });
  readonly openedCount = computed(() => this.orders().filter(order => order.status === 'opened').length);
  readonly closedCount = computed(() => this.orders().filter(order => order.status === 'closed').length);

  constructor(private http: HttpClient) {}
  ngOnInit(): void { this.loadOrders(); }

  private normalize(order: Order): Order {
    const legacy = order.notes as unknown as string | OrderNote[];
    return {
      ...order,
      paymentMethod: order.paymentMethod || 'cod',
      paymentStatus: order.paymentStatus || (order.paymentMethod === 'stripe' ? 'pending' : 'unpaid'),
      notes: Array.isArray(legacy) ? legacy : legacy?.trim()
      ? [{ createdAt: order.createdAt || order.updatedAt, description: legacy }] : [] };
  }

  paymentStatusLabel(order: Order): string {
    const status = order.paymentStatus || (order.paymentMethod === 'stripe' ? 'pending' : 'unpaid');
    return status === 'unpaid' ? 'Due on delivery' : status[0].toUpperCase() + status.slice(1);
  }

  loadOrders(): void {
    this.loading.set(true); this.errorMessage.set('');
    this.http.get<Order[]>('/api/v1.0/orders').subscribe({
      next: orders => { this.orders.set(orders.map(order => this.normalize(order))); this.loading.set(false); },
      error: error => {
        this.errorMessage.set(error.error?.message || 'Could not load orders. Please try again.');
        this.loading.set(false);
      }
    });
  }

  setFilter(status: 'opened' | 'closed' | 'all'): void { this.selectedStatus.set(status); }
  openOrder(order: Order): void {
    this.selectedOrder.set({ ...order, notes: [...order.notes] });
    this.newNote.set(''); this.successMessage.set(''); this.errorMessage.set('');
    this.emailSubject.set('About your NEFRAVA order #' + order._id.slice(-6).toUpperCase());
    this.emailMessage.set(''); this.emailError.set(''); this.emailSuccess.set('');
  }
  closeDetails(): void { this.selectedOrder.set(null); }
  setSelectedStatus(status: 'opened' | 'closed'): void {
    this.selectedOrder.update(order => order ? { ...order, status } : null);
  }

  saveOrder(): void {
    const order = this.selectedOrder();
    if (!order || this.saving()) return;
    this.saving.set(true); this.errorMessage.set(''); this.successMessage.set('');
    const description = this.newNote().trim();
    const payload: { status: 'opened' | 'closed'; note?: string } = { status: order.status };
    if (description) payload.note = description;

    this.http.put<{ note?: OrderNote }>('/api/v1.0/orders/' + order._id, payload).subscribe({
      next: response => {
        this.orders.update(orders => orders.map(saved => saved._id === order._id
          ? { ...saved, status: payload.status, notes: response.note ? [...saved.notes, response.note] : saved.notes }
          : saved));
        this.selectedOrder.update(selected => selected
          ? { ...selected, status: payload.status, notes: response.note ? [...selected.notes, response.note] : selected.notes }
          : null);
        this.newNote.set(''); this.successMessage.set('Order updated successfully.');
        this.saving.set(false);
      },
      error: error => {
        this.errorMessage.set(error.error?.message || 'Could not update the order.');
        this.saving.set(false);
      }
    });
  }

  sendCustomerEmail(): void {
    const order = this.selectedOrder();
    const subject = this.emailSubject().trim();
    const message = this.emailMessage().trim();
    if (!order || !order.customer.email || this.sendingEmail()) return;
    if (!subject || !message) {
      this.emailError.set('Enter an email subject and message.');
      return;
    }

    this.sendingEmail.set(true); this.emailError.set(''); this.emailSuccess.set('');
    this.http.post('/api/v1.0/orders/' + order._id + '/email', { subject, message }).subscribe({
      next: () => {
        this.emailSuccess.set('Email sent to ' + order.customer.email + '.');
        this.emailMessage.set('');
        this.sendingEmail.set(false);
      },
      error: error => {
        this.emailError.set(error.error?.message || 'Could not send the email. Check Mailpit and try again.');
        this.sendingEmail.set(false);
      }
    });
  }

  formatDate(date: string): string { return new Date(date).toLocaleString(); }
  countItems(total: number, item: OrderItem): number { return total + item.quantity; }
}
