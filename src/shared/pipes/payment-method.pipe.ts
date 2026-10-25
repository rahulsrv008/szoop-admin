import { Pipe, PipeTransform } from '@angular/core';
import { paymentMethodLabel } from '@config/constants';

/** Human label for the instrument stored on a payment. */
@Pipe({ name: 'paymentMethod' })
export class PaymentMethodPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    return paymentMethodLabel(value);
  }
}
