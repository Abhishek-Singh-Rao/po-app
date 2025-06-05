sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/comp/smartvariants/PersonalizableInfo",
  "sap/ui/model/Filter",
  "sap/ui/core/Fragment",
  "sap/m/MessageToast",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageBox",

], function (Controller, PersonalizableInfo, Filter, Fragment, MessageToast, FilterOperator, MessageBox) {
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
      this.oSmartVariantManagement.initialise(() => { }, this.oFilterBar);
    },

    // ---------------- Filter Handling ----------------
    onSearch: function () {
      if (this.oTable) this.oTable.setBusy(true);

      const aFilterItems = this.oFilterBar.getFilterGroupItems();
      const aFilters = [];

      aFilterItems.forEach((oItem) => {
        const sField = oItem.getName();
        const oControl = oItem.getControl();
        const aSelectedKeys = oControl.getSelectedKeys?.() || [];

        if (aSelectedKeys.length > 0) {
          const operator = ["ID", "Vendor_Number", "Company_Code", "DocumentType_ID"].includes(sField)
            ? FilterOperator.EQ
            : FilterOperator.Contains;

          const aSubFilters = aSelectedKeys.map((sKey) => new Filter(sField, operator, sKey));
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
          setTimeout(applyFilters, 200);
        }
      };

      applyFilters();
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
      return `${aItems.length} filter(s) active: ${aItems.join(", ")}`;
    },

    getFormattedSummaryTextExpanded: function () {
      const aVisible = this.oFilterBar.retrieveFiltersWithValues();
      const aHidden = this.oFilterBar.retrieveNonVisibleFiltersWithValues();
      let sText = `${aVisible.length} filter(s) active`;
      if (aHidden?.length > 0) sText += ` (${aHidden.length} hidden)`;
      return sText;
    },

    // ---------------- Navigation ----------------
    onItemPress: function (oEvent) {
      const oItem = oEvent.getSource();
      const sId = oItem.getBindingContext().getProperty("ID");
      this.getOwnerComponent().getRouter().navTo("RouteDetail", {
        ID: encodeURIComponent(sId)
      });
    },

    // ---------------- Amount Formatter ----------------
    formatTotalAmount: function (aItems) {
      if (!Array.isArray(aItems)) return "0.00 INR";
      const oModel = this.getView().getModel();
      let totalAmount = 0;

      aItems.forEach((ctxPath) => {
        const item = oModel.getProperty("/" + ctxPath);
        if (item?.Amount) totalAmount += item.Amount;
      });

      return totalAmount.toFixed(2) + " INR";
    },

    // DELETE
    onDeleteProduct: function () {
      const oSelected = this.oTable.getSelectedItem();
      if (!oSelected) {
        MessageBox.information("Please select a record to delete.");
        return;
      }

      const oContext = oSelected.getBindingContext();
      const sPath = oContext.getPath();

      MessageBox.confirm("Are you sure you want to delete this item?", {
        onClose: (oAction) => {
          if (oAction === MessageBox.Action.OK) {
            oContext.getModel().remove(sPath, {
              success: () => {
                MessageBox.success("Deleted successfully");
                this.oTable.getBinding("items").refresh();
              },
              error: () => MessageBox.error("Deletion failed")
            });
          }
        }
      });
    }
  });
});
