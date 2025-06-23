sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (BaseController) => {
  "use strict";

  return BaseController.extend("com.ycl.purchaseorder.controller.App", {
      onInit() {
        const oThemeModel = new sap.ui.model.json.JSONModel({
          isDark: sap.ui.getCore().getConfiguration().getTheme().includes("dark")
        });
        this.getView().setModel(oThemeModel, "themeModel");
      },

      onToggleTheme: function () {
        const oThemeModel = this.getView().getModel("themeModel");
        const isCurrentlyDark = oThemeModel.getProperty("/isDark");
      
        const newTheme = isCurrentlyDark ? "sap_horizon" : "sap_horizon_dark";
        sap.ui.getCore().applyTheme(newTheme);
        localStorage.setItem("userTheme", newTheme);
      
        // Update model to flip icon
        oThemeModel.setProperty("/isDark", !isCurrentlyDark);
      }
      
      
  });
});