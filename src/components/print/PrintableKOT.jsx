import React, { forwardRef } from 'react';

const PrintableKOT = forwardRef(({ restaurant, order, tableNumber }, ref) => {
  if (!order) return null;

  return (
    <div ref={ref} className="print-container" style={{ display: 'none' }}>
      <div className="print-area">
        <h1 style={{ fontSize: '24px', borderBottom: '2px solid black', paddingBottom: '5px' }}>K.O.T</h1>
        {restaurant?.name && <h2 style={{ margin: '5px 0' }}>{restaurant.name}</h2>}
        
        <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }}>
          Table: {tableNumber || order.tableNumber}
        </p>
        <p>Order #{order.id?.substring(0, 6).toUpperCase()}</p>
        <p>Time: {new Date(order.createdAt?.seconds * 1000 || Date.now()).toLocaleTimeString()}</p>
        
        <div className="print-divider" style={{ borderTop: '2px solid black' }} />
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid black' }}>
              <th style={{ textAlign: 'center', paddingBottom: '5px', width: '20%' }}>Qty</th>
              <th style={{ textAlign: 'left', paddingBottom: '5px' }}>Item</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, idx) => (
              <React.Fragment key={idx}>
                <tr>
                  <td style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', padding: '5px 0', verticalAlign: 'top' }}>
                    {item.quantity} x
                  </td>
                  <td style={{ padding: '5px 0', fontSize: '14px', fontWeight: 'bold' }}>
                    {item.name}
                  </td>
                </tr>
                {item.note && (
                  <tr>
                    <td></td>
                    <td style={{ paddingBottom: '5px', fontSize: '12px', fontStyle: 'italic' }}>
                      Note: {item.note}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        
        <div className="print-divider" style={{ borderTop: '2px solid black', marginTop: '10px' }} />
        <p style={{ textAlign: 'center', marginTop: '10px' }}>--- END OF KOT ---</p>
      </div>
    </div>
  );
});

export default PrintableKOT;
