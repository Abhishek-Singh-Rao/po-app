sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History"
], function (Controller, History) {
  "use strict";

  return Controller.extend("com.ycl.purchaseorder.controller.Detail", {
    onInit: function () {
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("RouteDetail").attachMatched(this._onObjectMatched, this);
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

    onNavBack: function () {
      const oHistory = History.getInstance();
      const sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        this.getOwnerComponent().getRouter().navTo("RouteList", {}, true);
      }
    },

    formatTotalAmount: function (aItems) {
      if (!Array.isArray(aItems)) return "0.00 INR";
      let total = 0;
      aItems.forEach(item => {
        if (typeof item.Amount === "number") {
          total += item.Amount;
        }
      });
      return total.toFixed(2) + " INR";
    }
  });
});
