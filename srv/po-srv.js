const cds = require("@sap/cds");

module.exports = cds.service.impl(async (service)=> {

    service.after("READ", "PurchaseOrder", async(data) => {
        data.forEach(element => {
            element.TotalAmount = 5000;
        });
    })

})