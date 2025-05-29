using com.ycl as db from '../db/schema';

service POService {

  entity PurchaseOrder as projection on db.PurchaseOrder {
    *,
    virtual null as TotalAmount: Integer64
  };

  entity PurchaseOrderItems as projection on db.PurchaseOrderItems;
  entity Vendor as projection on db.Vendor;
  entity Company as projection on db.Company;
  entity DocumentType as projection on db.DocumentType;
}
