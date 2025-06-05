sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'com/ycl/poappfe/test/integration/FirstJourney',
		'com/ycl/poappfe/test/integration/pages/PurchaseOrderList',
		'com/ycl/poappfe/test/integration/pages/PurchaseOrderObjectPage',
		'com/ycl/poappfe/test/integration/pages/PurchaseOrderItemsObjectPage'
    ],
    function(JourneyRunner, opaJourney, PurchaseOrderList, PurchaseOrderObjectPage, PurchaseOrderItemsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('com/ycl/poappfe') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onThePurchaseOrderList: PurchaseOrderList,
					onThePurchaseOrderObjectPage: PurchaseOrderObjectPage,
					onThePurchaseOrderItemsObjectPage: PurchaseOrderItemsObjectPage
                }
            },
            opaJourney.run
        );
    }
);