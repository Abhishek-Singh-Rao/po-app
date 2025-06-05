sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/ycl/purchaseorder/model/models"
  ], function(UIComponent, models) {
    "use strict";
  
    return UIComponent.extend("com.ycl.purchaseorder.Component", {
      metadata: {
        manifest: "json",
        interfaces: [
          "sap.ui.core.IAsyncContentCreation"
        ]
      },
  
      init: function() {
        UIComponent.prototype.init.apply(this, arguments);
        jQuery.sap.includeStyleSheet(jQuery.sap.getModulePath("com.ycl.purchaseorder.css") + "/style.css");
        this.setModel(models.createDeviceModel(), "device");
        this.getRouter().initialize();  // ❗️Fails if routing is not defined properly
      }
    });
  });
  