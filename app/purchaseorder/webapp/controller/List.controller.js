sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/comp/smartvariants/PersonalizableInfo",
  "sap/ui/model/Filter",
  "sap/ui/core/Fragment",
  "sap/m/MessageToast",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageBox",
  "sap/m/Token"
], function (
  Controller,
  PersonalizableInfo,
  Filter,
  Fragment,
  MessageToast,
  FilterOperator,
  MessageBox,
  Token
) {
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
      this.oSmartVariantManagement.initialise(() => {}, this.oFilterBar);
    },

    onSearch: function () {
      if (this.oTable) this.oTable.setBusy(true);

      const aFilterItems = this.oFilterBar.getFilterGroupItems();
      const aFilters = [];

      aFilterItems.forEach((oItem) => {
        const sField = oItem.getName();
        const oControl = oItem.getControl();

        if (sField === "PO_Search") {
          const sValue = oControl.getValue();
          if (sValue) {
            aFilters.push(new Filter("ID", FilterOperator.EQ, sValue));
          }
        } else if (sField === "Description") {
          const aTokens = oControl.getTokens();
          if (aTokens.length > 0) {
            const aSubFilters = aTokens.map((oToken) =>
              new Filter("Description", FilterOperator.Contains, oToken.getText())
            );
            aFilters.push(new Filter({ filters: aSubFilters, and: false }));
          }
        } else {
          const aSelectedKeys = oControl.getSelectedKeys?.() || [];

          if (aSelectedKeys.length > 0) {
            const operator = ["ID", "Vendor_Number", "Company_Code", "DocumentType_ID"].includes(sField)
              ? FilterOperator.EQ
              : FilterOperator.Contains;

            const aSubFilters = aSelectedKeys.map((sKey) => new Filter(sField, operator, sKey));
            aFilters.push(new Filter({ filters: aSubFilters, and: false }));
          }
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

    onPOSuggest: function (oEvent) {
      const sTerm = oEvent.getParameter("suggestValue");
      const oInput = oEvent.getSource();
      const oBinding = oInput.getBinding("suggestionItems");

      if (!sTerm) {
        oBinding.filter([]);
        return;
      }

      const oFilter = new Filter("Description", FilterOperator.Contains, sTerm);
      oBinding.filter([oFilter]);
    },

    onPODescriptionHelp: function (oEvent) {
      const oView = this.getView();

      if (!this._oPODescDialog) {
        Fragment.load({
          id: oView.getId(),
          name: "com.ycl.purchaseorder.fragment.PODescriptionValueHelp",
          controller: this
        }).then((oDialog) => {
          this._oPODescDialog = oDialog;
          oView.addDependent(oDialog);
          oDialog.setModel(oView.getModel());
          oDialog.open();
        });
      } else {
        this._oPODescDialog.open();
      }

      this._oPODescField = oEvent.getSource(); // MultiInput field reference
    },

    onPODescriptionSearch: function (oEvent) {
      const sValue = oEvent.getParameter("value");
      const oFilter = new Filter("Description", FilterOperator.Contains, sValue);
      const oBinding = oEvent.getSource().getBinding("items");
      oBinding.filter([oFilter]);
    },

    onPODescriptionConfirm: function (oEvent) {
      const aSelectedItems = oEvent.getParameter("selectedItems");
      if (aSelectedItems && aSelectedItems.length > 0 && this._oPODescField) {
        this._oPODescField.removeAllTokens();

        aSelectedItems.forEach((item) => {
          const sText = item.getTitle();
          this._oPODescField.addToken(new Token({ text: sText }));
        });

        this.oFilterBar.fireFilterChange();
      }
    },

    onPODescriptionCancel: function (oEvent) {
      const oDialog = oEvent.getSource();
      const oBinding = oDialog.getBinding("items");
      oBinding.filter([]);
      this._oPODescField = null;
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

    onItemPress: function (oEvent) {
      const oItem = oEvent.getSource();
      const sId = oItem.getBindingContext().getProperty("ID");
      this.getOwnerComponent().getRouter().navTo("RouteDetail", {
        ID: encodeURIComponent(sId)
      });
    },

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
