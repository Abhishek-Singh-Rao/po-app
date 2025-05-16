namespace com.ycl;

using {
    managed
} from '@sap/cds/common';

entity Vendor {
    key Number: Int16;
    Description: String(60);
}

entity Company {
    key Code: Int16;
    Description: String(60);
}

entity DocumentType {
    key ID: String(2);
    Description: String(40);
}

entity PurchaseOrder : managed {
    key ID: Int16;
    Description: String;
    Vendor: Association to one Vendor;
    Company: Association to one Company;
    DocumentType: Association to one DocumentType;
    Items: Composition of many PurchaseOrderItems on Items.PO = $self;
}

entity PurchaseOrderItems : managed {
    key PO: Association to one PurchaseOrder;
    key ItemNo: Int16;
    Description: String;
    Quantity: Int16;
    Uom: String(5);
    Rate: Int16;
    Amount: Int16;
}