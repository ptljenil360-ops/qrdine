import React, { forwardRef } from 'react';
import { formatCurrency } from '../../utils/formatCurrency';

const PrintableBill = forwardRef(({ restaurant, order, tableNumber }, ref) => {
  if (!restaurant || !order) return null;

  return (
    <div ref={ref} className="print-container" style={{ display: 'none' }}>
      <div className="print-area">
        <h1>{restaurant.name}</h1>
        {restaurant.address && <p style={{ textAlign: 'center' }}>{restaurant.address}</p>}
        {restaurant.phone && <p style={{ textAlign: 'center' }}>Tel: {restaurant.phone}</p>}
        {restaurant.gstNumber && <p style={{ textAlign: 'center' }}>GSTIN: {restaurant.gstNumber}</p>}
        
        <div className="print-divider" />
        
        <p><strong>Table: {tableNumber || order.tableNumber}</strong></p>
        <p>Order #{order.id?.substring(0, 6).toUpperCase()}</p>
        <p>Date: {new Date(order.createdAt?.seconds * 1000 || Date.now()).toLocaleString()}</p>
        
        <div className="print-divider" />
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px dashed black' }}>
              <th style={{ textAlign: 'left', paddingBottom: '3px' }}>Item</th>
              <th style={{ textAlign: 'center', paddingBottom: '3px' }}>Qty</th>
              <th style={{ textAlign: 'right', paddingBottom: '3px' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <tr key={idx}>
                <td style={{ padding: '3px 0' }}>{item.name}</td>
                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="print-divider" />
        
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(order.subtotal)}</td>
            </tr>
            {order.gstAmount > 0 && (
              <tr>
                <td>GST ({order.gstRate}%)</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(order.gstAmount)}</td>
              </tr>
            )}
            <tr style={{ fontWeight: 'bold', fontSize: '14px' }}>
              <td style={{ paddingTop: '5px' }}>GRAND TOTAL</td>
              <td style={{ textAlign: 'right', paddingTop: '5px' }}>{formatCurrency(order.grandTotal)}</td>
            </tr>
          </tbody>
        </table>
        
        <div className="print-divider" />
        
        <p style={{ textAlign: 'center', marginTop: '10px' }}>Thank you for visiting!</p>
        <p style={{ textAlign: 'center', fontSize: '10px' }}>Powered by RaShoyi</p>
      </div>
    </div>
  );
});

export default PrintableBill;
