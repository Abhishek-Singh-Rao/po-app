sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/comp/smartvariants/PersonalizableInfo",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator"
], function (Controller, PersonalizableInfo, Filter, FilterOperator) {
  "use strict";

  return Controller.extend("com.ycl.purchaseorder.controller.List", {
    onInit: function () {
      this.oSmartVariantManagement = this.byId("svm");
      this.oFilterBar = this.byId("filterbar");
      this.oExpandedLabel = this.byId("expandedLabel");
      this.oSnappedLabel = this.byId("snappedLabel");
      this.oTable = this.byId("table");

      const oPersInfo = new PersonalizableInfo({
        type: "filterBar",
        keyName: "persistencyKey",
        dataSource: "",
        control: this.oFilterBar
      });

      this.oSmartVariantManagement.addPersonalizableControl(oPersInfo);
      this.oSmartVariantManagement.initialise(function () {}, this.oFilterBar);
    },

    onSearch: function () {
      if (this.oTable) this.oTable.setBusy(true);

      const aFilterItems = this.oFilterBar.getFilterGroupItems();
      const aFilters = [];

      aFilterItems.forEach(function (oFilterGroupItem) {
        const sField = oFilterGroupItem.getName();
        const oControl = oFilterGroupItem.getControl();
        const aSelectedKeys = oControl.getSelectedKeys?.() || [];

        if (aSelectedKeys.length > 0) {
          const operator = ["ID", "Vendor_Number", "Company_Code", "DocumentType_ID"].includes(sField)
            ? FilterOperator.EQ
            : FilterOperator.Contains;

          const aSubFilters = aSelectedKeys.map(function (sKey) {
            return new Filter(sField, operator, sKey);
          });

          aFilters.push(new Filter({ filters: aSubFilters, and: false }));
        }
      });

      const applyFilters = () => {
        const oBinding = this.oTable.getBinding("items");
        if (oBinding) {
          oBinding.filter(aFilters);
          this.oTable.setShowOverlay(false);
          this.oTable.setBusy(false);
        } else {
          setTimeout(applyFilters, 200); // Retry after 200ms
        }
      };

      applyFilters();
    },

    onItemPress: function (oEvent) {
      const oItem = oEvent.getSource();
      const oContext = oItem.getBindingContext();
      const sId = oContext.getProperty("ID");

      this.getOwnerComponent().getRouter().navTo("RouteDetail", {
        ID: encodeURIComponent(sId)
      });
    },

    onSelectionChange: function () {
      this.oSmartVariantManagement.currentVariantSetModified(true);
      this.oFilterBar.fireFilterChange();
    },

    onFilterChange: function () {
      this._updateLabelsAndTable();
    },

    onAfterVariantLoad: function () {
      this._updateLabelsAndTable();
    },

    _updateLabelsAndTable: function () {
      this.oExpandedLabel.setText(this.getFormattedSummaryTextExpanded());
      this.oSnappedLabel.setText(this.getFormattedSummaryText());
      this.oTable.setShowOverlay(true);
    },

    getFormattedSummaryText: function () {
      const aItems = this.oFilterBar.retrieveFiltersWithValues();
      if (aItems.length === 0) return "No filters active";
      if (aItems.length === 1) return "1 filter active: " + aItems.join(", ");
      return aItems.length + " filters active: " + aItems.join(", ");
    },

    getFormattedSummaryTextExpanded: function () {
      const aVisible = this.oFilterBar.retrieveFiltersWithValues();
      if (aVisible.length === 0) return "No filters active";
      let sText = aVisible.length + " filter(s) active";
      const aHidden = this.oFilterBar.retrieveNonVisibleFiltersWithValues();
      if (aHidden && aHidden.length > 0) {
        sText += " (" + aHidden.length + " hidden)";
      }
      return sText;
    },

    formatTotalAmount: function (aItems) {
      if (!Array.isArray(aItems)) return "0.00 INR";

      const oModel = this.getView().getModel();
      let totalAmount = 0;

      aItems.forEach(ctxPath => {
        const item = oModel.getProperty("/" + ctxPath);
        if (item && typeof item.Amount === "number") {
          totalAmount += item.Amount;
        }
      });

      return totalAmount.toFixed(2) + " INR";
    }
  });
});
