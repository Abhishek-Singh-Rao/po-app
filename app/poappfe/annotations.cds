using POService as service from '../../srv/po-srv';
annotate service.PurchaseOrder with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'ID',
                Value : ID,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Description',
                Value : Description,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Vendor_Number',
                Value : Vendor_Number,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Company_Code',
                Value : Company_Code,
            },
            {
                $Type : 'UI.DataField',
                Label : 'DocumentType_ID',
                Value : DocumentType_ID,
            },
            {
                $Type : 'UI.DataField',
                Label : 'TotalAmount',
                Value : TotalAmount,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Items',
            ID : 'Items',
            Target : 'Items/@UI.LineItem#Items',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'ID',
            Value : ID,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Description',
            Value : Description,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Vendor_Number',
            Value : Vendor_Number,
        },
        {
            $Type : 'UI.DataField',
            Label : 'Company_Code',
            Value : Company_Code,
        },
        {
            $Type : 'UI.DataField',
            Label : 'DocumentType_ID',
            Value : DocumentType_ID,
        },
    ],
);

annotate service.PurchaseOrder with {
    Vendor @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'Vendor',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : Vendor_Number,
                ValueListProperty : 'Number',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'Description',
            },
        ],
    }
};

annotate service.PurchaseOrder with {
    Company @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'Company',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : Company_Code,
                ValueListProperty : 'Code',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'Description',
            },
        ],
    }
};

annotate service.PurchaseOrder with {
    DocumentType @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'DocumentType',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : DocumentType_ID,
                ValueListProperty : 'ID',
            },
            {
                $Type : 'Common.ValueListParameterDisplayOnly',
                ValueListProperty : 'Description',
            },
        ],
    }
};

annotate service.PurchaseOrderItems with @(
    UI.LineItem #Items : [
        {
            $Type : 'UI.DataField',
            Value : ItemNo,
            Label : 'ItemNo',
        },
        {
            $Type : 'UI.DataField',
            Value : Description,
            Label : 'Description',
        },
        {
            $Type : 'UI.DataField',
            Value : Quantity,
            Label : 'Quantity',
        },
        {
            $Type : 'UI.DataField',
            Value : Uom,
            Label : 'Uom',
        },
        {
            $Type : 'UI.DataField',
            Value : Rate,
            Label : 'Rate',
        },
        {
            $Type : 'UI.DataField',
            Value : Amount,
            Label : 'Amount',
        },
    ]
);

