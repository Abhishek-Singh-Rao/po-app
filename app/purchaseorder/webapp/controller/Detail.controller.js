sap.ui.define([
      "sap/ui/core/mvc/Controller",
      "sap/ui/model/json/JSONModel",
      "sap/ui/core/Fragment",
      "sap/m/MessageBox",
      "sap/m/MessageToast",
      "sap/ui/core/routing/History"
], function (Controller, JSONModel, Fragment, MessageBox, MessageToast, History) {
      "use strict";

      return Controller.extend("com.ycl.purchaseorder.controller.Detail", {
            onInit: function () {
                  const oRouter = this.getOwnerComponent().getRouter();
                  const oTable = this.byId("ItemsTable");

                  // View mode model (edit/display switch)
                  const viewData = {
                        isEditMode: false,
                        isDisplayMode: true,
                  };
                  const viewModel = new JSONModel(viewData);
                  this.getView().setModel(viewModel, "viewModel");

                  // Attach route matched handler
                  oRouter.getRoute("RouteDetail").attachMatched(this._onObjectMatched, this);
                  oRouter.getRoute("RouteCreate").attachMatched(this._onCreateMatched, this);

                  // Attempt to get the OData model from the Component
                  const oModel = this.getOwnerComponent().getModel();

                  if (oModel) {
                        // Optional but useful for managing batched changes
                        oModel.setDeferredGroups(["changes"]);


                        // ✅ Preload Company data for dropdown
                        oModel.read("/Company", {
                              success: () => console.log("✅ Company data loaded"),
                              error: () => MessageToast.show("Failed to load Company data")
                        });

                        // ✅ Preload DocumentType data for dropdown
                        oModel.read("/DocumentType", {
                              success: () => console.log("✅ DocumentType data loaded"),
                              error: () => MessageToast.show("Failed to load DocumentType data")
                        });
                  } else {
                        console.error("OData model is undefined. Check manifest and Component.js.");
                  }

                  // Attach item table handler only if available
                  if (oTable) {
                        const oBinding = oTable.getBinding("items");

                        if (oBinding) {
                              oBinding.attachEvent("dataReceived", function () {
                                    if (oBinding.isLengthFinal() && oBinding.isFirstCreateAtEnd() === undefined) {
                                          oBinding.create({}, true, { inactive: true });
                                    }
                              });
                        } else {
                              console.warn("Items binding not yet available.");
                        }
                  } else {
                        console.error("Table with ID 'ItemsTable' not found. Check XML view.");
                  }
            },


            _onObjectMatched: function (oEvent) {
                  const sId = decodeURIComponent(oEvent.getParameter("arguments").ID);
                  this.sPurchaseOrder = sId;
                  const sPath = `/PurchaseOrder(${sId})`;

                  const oView = this.getView();
                  const oTable = this.byId("ItemsTable");

                  oView.bindElement({
                        path: sPath,
                        parameters: {
                              expand: "Company,Vendor,DocumentType"
                        }
                  });
                  oView.getModel().metadataLoaded().then(() => {
                        const oBinding = oTable.getBinding("items");
                        if (oBinding) {
                              oBinding.attachEventOnce("dataReceived", function () {
                                    const aContexts = oBinding.getContexts();
                                    if (aContexts.length === 0) {
                                          oBinding.create({}, true, { inactive: true });
                                    }

                                    //  Recalculate Amount for each item
                                    aContexts.forEach(ctx => {
                                          const item = ctx.getObject();
                                          const quantity = parseFloat(item?.Quantity);
                                          const rate = parseFloat(item?.Rate);
                                          if (!isNaN(quantity) && !isNaN(rate)) {
                                                const amount = quantity * rate;
                                                ctx.getModel().setProperty(ctx.getPath() + "/Amount", amount);
                                          }
                                    });

                                    //  Update Total after calculating individual Amounts
                                    this.updateTotalAmount();
                              }.bind(this));


                        }
                  });

            },

            // Total Amount
            updateTotalAmount: function () {
                  const oTable = this.byId("ItemsTable");
                  const oBinding = oTable.getBinding("items");

                  if (!oBinding) return;

                  const aContexts = oBinding.getAllCurrentContexts();
                  let total = 0;

                  aContexts.forEach(ctx => {
                        const item = ctx.getObject();

                        const amount = parseFloat(item?.Amount);
                        if (!isNaN(amount)) {
                              total += amount;
                        }
                  });

                  // Update the ObjectNumber field
                  const oTotalAmountNumber = this.byId("totalAmountNumber");
                  oTotalAmountNumber.setNumber(total.toFixed(2));
            },
            onItemValueChange: function (oEvent) {
                  const oInput = oEvent.getSource();
                  const oContext = oInput.getBindingContext();
                  const oModel = oContext.getModel();
                  const sPath = oContext.getPath();

                  const oData = oModel.getProperty(sPath);

                  const quantity = parseFloat(oData.Quantity) || 0;
                  const rate = parseFloat(oData.Rate) || 0;
                  const amount = quantity * rate;

                  // Update the Amount property
                  oModel.setProperty(sPath + "/Amount", amount);

                  // Recalculate total amount
                  this.updateTotalAmount();
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
                  const oModel = this.getView().getModel();

                  oModel.resetChanges("changes", true); // Undo all deferred deletes and edits
                  oModel.refresh(true);                 // Refresh from server

                  MessageToast.show("Changes discarded.");
                  this.setMode("display");
            }
            ,

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
            onCompanyChange: function (oEvent) {
                  const oSelect = oEvent.getSource();
                  const selectedKey = oSelect.getSelectedKey();
                  const oContext = oSelect.getBindingContext();

                  if (oContext) {
                        const oModel = oContext.getModel();

                        // Step 1: Update the selected Company_Code in the model
                        oModel.setProperty(oContext.getPath() + "/Company_Code", selectedKey);

                        // Step 2: Reload the full Company object based on the selected key
                        oModel.read(`/Company('${selectedKey}')`, {
                              success: (oData) => {
                                    oModel.setProperty(oContext.getPath() + "/Company", oData);
                              },
                              error: () => {
                                    sap.m.MessageToast.show("Failed to load Company description.");
                              }
                        });
                  }
            },


            onSave: function () {
                  const oView = this.getView();
                  const oModel = oView.getModel();
              
                  if (!oModel.hasPendingChanges("changes")) {
                      MessageToast.show("No changes to save.");
                      return;
                  }
              
                  oView.setBusy(true);
              
                  oModel.submitChanges({
                      groupId: "changes",
                      success: () => {
                          oView.setBusy(false);
                          MessageToast.show("Changes saved.");
                          this.setMode("display");
              
                          // Get the new PO_ID if it was created
                          const oContext = oView.getBindingContext();
                          const PO_ID = oContext && oContext.getProperty("ID");
              
                          if (PO_ID) {
                              this.sPurchaseOrder = PO_ID; // store for item creation
              
                              // Rebind the view to get fresh data
                              const sPath = "/PurchaseOrder(" + PO_ID + ")";
                              oView.bindElement({
                                  path: sPath,
                                  parameters: {
                                      expand: "Company,Vendor,DocumentType"
                                  }
                              });
              
                              // Refresh table binding
                              const oTable = this.byId("ItemsTable");
                              const oBinding = oTable.getBinding("items");
                              if (oBinding) {
                                  oBinding.refresh();
                              }
                          }
              
                          // Refresh entire model to ensure delete visibility
                          oModel.refresh(true);
                      },
                      error: () => {
                          oView.setBusy(false);
                          MessageBox.error("Failed to save changes.");
                      }
                  });
              }
              ,

            // Create New Record
            onCreateRow: function () {
                  const oTable = this.byId("ItemsTable");
                  const oBinding = oTable.getBinding("items");

                  if (!oBinding) {
                        sap.m.MessageToast.show("Binding not found. Make sure parent context is set.");
                        return;
                  }

                  // Get parent PO ID from header binding (for edit mode)
                  const oHeaderContext = this.getView().getBindingContext();
                  const PO_ID = oHeaderContext && oHeaderContext.getProperty("ID");  // Will be undefined in create mode

                  // Get current contexts (rows) from the binding
                  const aContexts = oBinding.getCurrentContexts();

                  // Find the max existing ItemNo
                  let maxItemNo = 0;
                  aContexts.forEach(ctx => {
                        const oItem = ctx.getObject();
                        if (oItem && typeof oItem.ItemNo === "number") {
                              maxItemNo = Math.max(maxItemNo, oItem.ItemNo);
                        }
                  });

                  const nextItemNo = maxItemNo + 1;

                  // Create new row with calculated ItemNo
                  const oNewData = {
                        ItemNo: nextItemNo
                  };

                  if (PO_ID) {
                        oNewData.PO_ID = PO_ID;  // only assign if it's not null
                  }

                  oBinding.create(oNewData, true);  // true = insert at end

                  sap.m.MessageToast.show("New row added with ItemNo: " + nextItemNo);

                  // Optional: Update Amount if Quantity and Rate are present
                  setTimeout(() => {
                        const aUpdatedContexts = oBinding.getCurrentContexts();
                        const newCtx = aUpdatedContexts[aUpdatedContexts.length - 1];

                        if (newCtx) {
                              const newItem = newCtx.getObject();
                              const quantity = parseFloat(newItem?.Quantity);
                              const rate = parseFloat(newItem?.Rate);

                              if (!isNaN(quantity) && !isNaN(rate)) {
                                    const amount = quantity * rate;
                                    newCtx.getModel().setProperty(newCtx.getPath() + "/Amount", amount);
                              }
                        }

                        this.updateTotalAmount();
                  }, 200);
            },

            onVendorValueHelp: function (oEvent) {
                  const oView = this.getView();

                  if (!this._oVendorDialog) {
                        Fragment.load({
                              id: oView.getId(),
                              name: "com.ycl.purchaseorder.fragment.VendorValueHelp", // match your folder
                              controller: this
                        }).then((oDialog) => {
                              this._oVendorDialog = oDialog;
                              oView.addDependent(oDialog);
                              oDialog.setModel(oView.getModel()); // default OData model
                              oDialog.open();
                        });
                  } else {
                        this._oVendorDialog.open();
                  }

                  this._oVendorInput = oEvent.getSource(); // store input reference
            },

            onVendorSearch: function (oEvent) {
                  const sValue = oEvent.getParameter("value");
                  const oFilter = new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, sValue);
                  const oBinding = oEvent.getSource().getBinding("items");
                  oBinding.filter([oFilter]);
            },

            onVendorConfirm: function (oEvent) {
                  const oSelectedItem = oEvent.getParameter("selectedItem");
                  if (oSelectedItem && this._oVendorInput) {
                        const sDescription = oSelectedItem.getTitle();       // e.g. "GreenLeaf Traders"
                        const sNumber = oSelectedItem.getDescription();      // e.g. "3" as string

                        const oContext = this._oVendorInput.getBindingContext();
                        if (oContext) {
                              const oModel = oContext.getModel();
                              const sPath = oContext.getPath();

                              // ✅ Set flat key property for backend save
                              oModel.setProperty(sPath + "/Vendor_Number", sNumber); // or parseInt(sNumber) if numeric

                              // ✅ Optional: update nested display fields
                              oModel.setProperty(sPath + "/Vendor", {
                                    Description: sDescription,
                                    Number: sNumber // avoid NaN
                              });
                        }
                  }
            },

            onVendorCancel: function (oEvent) {
                  const oBinding = oEvent.getSource().getBinding("items");
                  if (oBinding) oBinding.filter([]);
                  this._oVendorInput = null;
            },
            onDeleteRow: function () {
                  const oTable = this.byId("ItemsTable");
                  const aSelectedItems = oTable.getSelectedItems();
              
                  if (aSelectedItems.length === 0) {
                      MessageToast.show("Please select at least one row to delete.");
                      return;
                  }
              
                  MessageBox.confirm(`Are you sure you want to delete ${aSelectedItems.length} item(s)?`, {
                      title: "Confirm Deletion",
                      actions: [MessageBox.Action.YES, MessageBox.Action.NO],
                      emphasizedAction: MessageBox.Action.YES,
                      onClose: (sAction) => {
                          if (sAction === MessageBox.Action.YES) {
                              const oModel = this.getView().getModel();
                              const oBinding = oTable.getBinding("items");
              
                              aSelectedItems.forEach(oItem => {
                                  const oCtx = oItem.getBindingContext();
                                  const sPath = oCtx.getPath();
              
                                  // Check if the context is transient (i.e., unsaved new row)
                                  if (oCtx.isTransient && oCtx.isTransient()) {
                                      // Delete directly from the list binding
                                      oBinding.remove(oCtx);
                                  } else {
                                      // For existing (backend) rows, mark for deletion
                                      oModel.remove(sPath, {
                                          groupId: "changes",
                                          inactive: true
                                      });
                                  }
                              });
              
                              MessageToast.show(`${aSelectedItems.length} item(s) marked for deletion. Press Save to confirm or Cancel to undo.`);
                          }
                      }
                  });
              },

            formatTableMode: function (isEditMode) {
            return isEditMode ? "MultiSelect" : "None";
            },
              

            _onCreateMatched: function () {
                  const oView = this.getView();
                  const oModel = oView.getModel();

                  // Clear any previous selection
                  this.sPurchaseOrder = null;

                  // Create a new entry context
                  const oContext = oModel.createEntry("/PurchaseOrder", {
                        groupId: "changes", // defer actual backend call until submitChanges
                        properties: {
                              Description: "",
                              Vendor_Number: null,
                              Company_Code: null,
                              DocumentType_ID: null
                        }
                  });

                  // Bind view to the new context
                  oView.setBindingContext(oContext);

                  // Set mode to edit
                  this.setMode("edit");

                  // Get Items table and its binding
                  const oTable = this.byId("ItemsTable");
                  if (oTable) {
                        const oBinding = oTable.getBinding("items");
                        if (oBinding) {
                              oBinding.filter([]); // clear any previous rows

                              // Create a default first item row
                              oBinding.create({
                                    ItemNo: 1 // optional starting value
                              }, true);
                        }
                  }

                  // Reset Total Amount display
                  const oTotal = this.byId("totalAmountNumber");
                  if (oTotal) {
                        oTotal.setNumber("0.00");
                  }
            }

      });
});
