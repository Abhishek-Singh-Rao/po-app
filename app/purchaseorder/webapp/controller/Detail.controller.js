sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageBox",
  "sap/ui/core/routing/History"
], function (Controller, JSONModel, History) {
  "use strict";

  return Controller.extend("com.ycl.purchaseorder.controller.Detail", {
    onInit: function () {
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("RouteDetail").attachMatched(this._onObjectMatched, this);
      const viewData = {
        isEditMode: false,
        isDisplayMode: true,
      }
      const viewModel = new JSONModel(viewData)
      this.getView().setModel(viewModel, "viewModel")
    },

    _onObjectMatched: function (oEvent) {
      const sId = decodeURIComponent(oEvent.getParameter("arguments").ID);
      const sPath = `/PurchaseOrder(${sId})`;

      this.getView().bindElement({
        path: sPath,
        parameters: {
          expand: "Items,Company,Vendor,DocumentType"
        }
      });
    },

    // Total Amount
    formatTotalAmountFromItems: function (aItems) {
      if (!Array.isArray(aItems)) return "0.00";
      
      let total = 0;
      aItems.forEach((itemCtxPath) => {
        const oModel = this.getView().getModel();
        const item = oModel.getProperty("/" + itemCtxPath);
        
        const qty = parseFloat(item?.Quantity) || 0;
        const rate = parseFloat(item?.Rate) || 0;
        total += qty * rate;
      });
    
      return total.toFixed(2);
    },    
      
    // Modes
    setMode: function (sMode) {
      this.getView().getModel("viewModel").setProperty("/isEditMode", sMode === "edit" ? true : false)
      this.getView().getModel("viewModel").setProperty("/isDisplayMode", sMode === "display" ? true : false)
    },

    // Edit Button
    onEdit: function () {
      this.setMode("edit");
    },

    // Cancel Button
    onCancel: function () {
      this.setMode("display")
    },

    // Back Button
    onNavBack: function () {
      const oHistory = History.getInstance();
      const sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getOwnerComponent().getRouter().navTo("RouteList", {}, true);
      }
    },

    // Propercase
    toProperCase: function (sText) {
      if (!sText || typeof sText !== "string") return "";
      return sText.charAt(0).toUpperCase() + sText.slice(1).toLowerCase();
    },

    // Save
  //   onSave: function () {
  //     const oView = this.getView();
  //     const oModel = oView.getModel(); // OData V2 model
  //     const oContext = oView.getBindingContext(); // PO Header context (e.g., /PurchaseOrder(1001))
  
  //     if (!oContext) {
  //         MessageBox.error("No purchase order selected.");
  //         return;
  //     }
  
  //     const sPOPath = oContext.getPath(); // e.g., /PurchaseOrder(1001)
  //     const oUpdatedPOData = oModel.getProperty(sPOPath); // Get updated PO header
  //     const aUpdatedItems = oModel.getProperty(sPOPath + "/Items"); // Get updated child items
  
  //     // Prepare a counter to track async updates
  //     let iPendingUpdates = aUpdatedItems.length + 1;
  //     let bErrorOccurred = false;
  
  //     const fnCheckFinish = () => {
  //         iPendingUpdates--;
  //         if (iPendingUpdates === 0) {
  //             if (bErrorOccurred) {
  //                 MessageBox.error("Some updates failed. Please check and try again.");
  //             } else {
  //                 MessageToast.show("Purchase Order saved successfully");
  //                 // Toggle back to display mode
  //                 oView.getModel("viewModel").setProperty("/isEditMode", false);
  //                 oView.getModel("viewModel").setProperty("/isDisplayMode", true);
  //                 oModel.refresh(); // Optional: to reload the updated values
  //             }
  //         }
  //     };
  
  //     // 1. Update PO Header
  //     oModel.update(sPOPath, oUpdatedPOData, {
  //         success: () => fnCheckFinish(),
  //         error: (err) => {
  //             console.error("Header update failed", err);
  //             bErrorOccurred = true;
  //             fnCheckFinish();
  //         }
  //     });
  
  //     // 2. Update each PO Item (child entity)
  //     aUpdatedItems.forEach((item) => {
  //         const sItemPath = `/PurchaseOrderItems(${item.ID})`; // Ensure ID is correct
  //         oModel.update(sItemPath, item, {
  //             success: () => fnCheckFinish(),
  //             error: (err) => {
  //                 console.error("Item update failed", err);
  //                 bErrorOccurred = true;
  //                 fnCheckFinish();
  //             }
  //         });
  //     });
  // }
  
    
  });
});
