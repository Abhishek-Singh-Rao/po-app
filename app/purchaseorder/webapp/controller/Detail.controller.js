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


                        //  Preload Company data for dropdown
                        oModel.read("/Company", {
                              success: () => console.log(" Company data loaded"),
                              error: () => MessageToast.show("Failed to load Company data")
                        });

                        // Preload DocumentType data for dropdown
                        oModel.read("/DocumentType", {
                              success: () => console.log("DocumentType data loaded"),
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
                  const oView = this.getView();
                  const oModel = oView.getModel();
                  const oTable = this.byId("ItemsTable");
                  const vm = oView.getModel("viewModel");
                
                  // CREATE FLOW
                  if (sId && sId.toUpperCase() === "NEW") {
                    const oContext = oModel.createEntry("/PurchaseOrder", {
                      groupId: "changes",
                      properties: {
                        Description: "",
                        Vendor_Number: null,
                        Company_Code: null,
                        DocumentType_ID: null
                      }
                    });
                
                    oView.setBindingContext(oContext);
                
                    // Explicitly bind Items to transient PurchaseOrder context
                    oTable.bindItems({
                      path: oContext.getPath() + "/Items",
                      template: oTable.getBindingInfo("items").template,
                      templateShareable: true
                    });
                
                    // Header: 0.00 initially
                    this.byId("totalAmountNumber").setNumber("0.00");
                
                    vm.setProperty("/isCreateMode", true);
                    this.setMode("edit");
                    vm.checkUpdate(true);
                  }
                
                  // EXISTING FLOW
                  else {
                    this.sPurchaseOrder = sId;
                
                    oView.bindElement({
                      path: `/PurchaseOrder(${sId})`,
                      parameters: {
                        expand: "Company,Vendor,DocumentType"
                      }
                    });
                
                    // Explicitly bind Items for existing PO
                    oTable.bindItems({
                      path: `/PurchaseOrder(${sId})/Items`,
                      template: oTable.getBindingInfo("items").template,
                      templateShareable: true
                    });
                
                    vm.setProperty("/isCreateMode", false);
                    this.setMode("display");
                
                    // When items load, calculate Amounts
                    oModel.metadataLoaded().then(() => {
                      const oBinding = oTable.getBinding("items");
                      if (oBinding) {
                        oBinding.attachEventOnce("dataReceived", () => {
                          oBinding.getContexts().forEach(ctx => {
                            const itm = ctx.getObject();
                            const amt = (+itm.Quantity || 0) * (+itm.Rate || 0);
                            ctx.getModel().setProperty(ctx.getPath() + "/Amount", amt);
                          });
                          this.updateTotalAmount();
                        });
                      }
                    });
                  }
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
                  const vm = this.getView().getModel("viewModel");
                
                  vm.setProperty("/isEditMode",    sMode === "edit");
                  vm.setProperty("/isDisplayMode", sMode === "display");
                
                  // Clear create flag only when switching to display
                  if (sMode === "display") {
                    vm.setProperty("/isCreateMode", false);
                  }
                
                  // Force UI bindings to refresh immediately
                  vm.checkUpdate(true);
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
                    const sPath = oContext.getPath(); // FIXED
                
                    // Step 1: Set the new company code
                    oModel.setProperty(sPath + "/Company_Code", selectedKey);
                
                    // Step 2: Read full Company object and update nested binding
                    oModel.read(`/Company(${selectedKey})`, {
                      success: (oData) => {
                        oModel.setProperty(sPath + "/Company", oData); 
                      },
                      error: () => {
                        sap.m.MessageToast.show("Failed to load company details.");
                      }
                    });
                  }
                },


                onSave: function () {
                  const oView    = this.getView();
                  const oModel   = oView.getModel();
                  const oContext = oView.getBindingContext();
                  const vm       = oView.getModel("viewModel");
                
                  // 1. Nothing to save 
                  if (!oModel.hasPendingChanges("changes")) {
                    MessageToast.show("No changes to save.");
                    return;
                  }
                
                  // 2. Validate PO ID if in create mode 
                  if (vm.getProperty("/isCreateMode")) {
                    const enteredId = oContext.getProperty("ID");
                    if (!enteredId) {
                      MessageToast.show("Please enter a Purchase Order No. before saving.");
                      return;
                    }
                
                    // 3. Inject PO_ID into every transient item
                    const oItemsBinding = this.byId("ItemsTable").getBinding("items");
                    if (oItemsBinding) {
                      oItemsBinding.getAllCurrentContexts().forEach(ctx => {
                        const curVal = ctx.getProperty("PO_ID");
                        if (!curVal) {
                          ctx.getModel().setProperty(ctx.getPath() + "/PO_ID", enteredId);
                        }
                      });
                    }
                  }
                
                  // 4. Submit changes
                  oView.setBusy(true);
                  oModel.submitChanges({
                    groupId: "changes",
                    success: (oData) => {
                      //  Handle any batch sub-errors
                      const hasError = (oData?.__batchResponses || []).some(r =>
                        r.response && r.response.statusCode >= "400"
                      );
                      if (hasError) {
                        oView.setBusy(false);
                        MessageBox.error("Save failed. Please check required fields.");
                        return;
                      }
                
                      oView.setBusy(false);
                      MessageToast.show("Changes saved.");
                      this.setMode("display");
                
                      const PO_ID = oContext.getProperty("ID");
                
                      //  Update the URL if this was a new PO
                      if (vm.getProperty("/isCreateMode") && PO_ID) {
                        this.getOwnerComponent()
                            .getRouter()
                            .navTo("RouteDetail", { ID: encodeURIComponent(PO_ID) }, true);
                        vm.setProperty("/isCreateMode", false);
                      }
                
                      // Rebind view to fresh data
                      if (PO_ID) {
                        oView.bindElement({
                          path: `/PurchaseOrder(${PO_ID})`,
                          parameters: { expand: "Company,Vendor,DocumentType" }
                        });
                
                        const tblBind = this.byId("ItemsTable").getBinding("items");
                        if (tblBind) {
                          tblBind.refresh();
                        }
                      }
                
                      // Refresh entire model so List page reflects it
                      oModel.refresh(true);
                    },
                    error: () => {
                      oView.setBusy(false);
                      MessageBox.error("Failed to save changes.");
                    }
                  });
                },                
                

            // Create New Record
            onCreateRow: function () {
                  const oView    = this.getView();
                  const vm       = oView.getModel("viewModel");
                  const oContext = oView.getBindingContext();
                  const poId     = oContext.getProperty("ID");
                
                  //  Guard clause: must enter PO ID before adding rows
                  if (vm.getProperty("/isCreateMode") && !poId) {
                    MessageToast.show("Please enter PO Number before adding items.");
                    return;
                  }
                
                  const oTable   = this.byId("ItemsTable");
                  const oBinding = oTable.getBinding("items");
                
                  if (!oBinding) {
                    MessageToast.show("Binding not found. Make sure parent context is set.");
                    return;
                  }
                
                  //  Find max existing ItemNo
                  const aContexts = oBinding.getCurrentContexts();
                  let maxItemNo = 0;
                  aContexts.forEach(ctx => {
                    const oItem = ctx.getObject();
                    if (oItem && typeof oItem.ItemNo === "number") {
                      maxItemNo = Math.max(maxItemNo, oItem.ItemNo);
                    }
                  });
                
                  const nextItemNo = maxItemNo + 1;
                
                  // Create new row with injected PO_ID
                  const oNewData = {
                    ItemNo: nextItemNo,
                    PO_ID: poId   //  always inject it manually
                  };
                
                  oBinding.create(oNewData, true); // true = insert at end
                  MessageToast.show("New row added with ItemNo: " + nextItemNo);
                
                  //  Recalculate Amount if Qty & Rate are set
                  setTimeout(() => {
                    const aUpdatedContexts = oBinding.getCurrentContexts();
                    const newCtx = aUpdatedContexts[aUpdatedContexts.length - 1];
                
                    if (newCtx) {
                      const newItem = newCtx.getObject();
                      const quantity = parseFloat(newItem?.Quantity);
                      const rate     = parseFloat(newItem?.Rate);
                
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
                      const oVendorContext = oSelectedItem.getBindingContext();
                      const sNumber = oVendorContext.getProperty("Number");
                      const sDescription = oVendorContext.getProperty("Description");
              
                      if (!sNumber) {
                          sap.m.MessageToast.show("Vendor number is missing.");
                          return;
                      }
              
                      const oContext = this._oVendorInput.getBindingContext();
              
                      if (oContext) {
                          const oModel = oContext.getModel();
                          const sPath = oContext.getPath();
              
                          // Step 1: Store vendor number in foreign key
                          oModel.setProperty(sPath + "/Vendor_Number", sNumber);
              
                          // Step 2: (Optional) Fetch complete vendor via OData read
                          const sKey = oModel.createKey("Vendor", { Number: sNumber });
              
                          oModel.read("/" + sKey, {
                              success: (oData) => {
                                  // Step 3: Set both fields to update input display
                                  oModel.setProperty(sPath + "/Vendor/Number", oData.Number);
                                  oModel.setProperty(sPath + "/Vendor/Description", oData.Description);
                              },
                              error: () => {
                                  sap.m.MessageToast.show("Failed to load vendor details.");
                              }
                          });
                      }
                  }
              }
              ,

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
                  const oTable = this.byId("ItemsTable");
                
                  this.sPurchaseOrder = null;
                
                  const oContext = oModel.createEntry("/PurchaseOrder", {
                    groupId: "changes",
                    properties: {
                      Description: "",
                      Vendor_Number: null,
                      Company_Code: null,
                      DocumentType_ID: null
                    }
                  });
                
                  oView.setBindingContext(oContext);
                  this.setMode("edit");
                
                  // Explicitly bind Items table
                  if (oTable) {
                    oTable.bindItems({
                      path: oContext.getPath() + "/Items",
                      template: oTable.getBindingInfo("items").template,
                      templateShareable: true
                    });
                  }
                
                  this.byId("totalAmountNumber").setNumber("0.00");
                }
                ,
                
            formatKeyValue: function (key, value) {
                  return key && value ? `${value} (${key})` : "";
              }
              


      });
});
