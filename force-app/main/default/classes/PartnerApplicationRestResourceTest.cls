@isTest
private class PartnerApplicationRestResourceTest {

    @TestSetup
    static void makeData() {
        List<Partner_Application__c> testApps = new List<Partner_Application__c>{
            new Partner_Application__c(
                Applicant_Name__c = 'Partner Alpha',
                Email__c = 'alpha@example.com',
                Status__c = 'New',
                Requested_Amount__c = 50000,
                Notes__c = 'Alpha notes'
            ),
            new Partner_Application__c(
                Applicant_Name__c = 'Partner Beta',
                Email__c = 'beta@example.com',
                Status__c = 'Approved',
                Requested_Amount__c = 75000,
                Notes__c = 'Beta notes'
            ),
            new Partner_Application__c(
                Applicant_Name__c = 'Partner Gamma',
                Email__c = 'gamma@example.com',
                Status__c = 'Under Review',
                Requested_Amount__c = 100000,
                Notes__c = 'Gamma notes'
            ),
            new Partner_Application__c(
                Applicant_Name__c = 'Partner Delta',
                Email__c = 'delta@example.com',
                Status__c = 'New',
                Requested_Amount__c = 25000,
                Notes__c = 'Delta notes'
            ),
            new Partner_Application__c(
                Applicant_Name__c = 'Partner Epsilon',
                Email__c = 'epsilon@example.com',
                Status__c = 'Rejected',
                Requested_Amount__c = 15000,
                Notes__c = 'Epsilon notes'
            ),
            new Partner_Application__c(
                Applicant_Name__c = 'Partner Zeta',
                Email__c = 'zeta@example.com',
                Status__c = 'New',
                Requested_Amount__c = 60000,
                Notes__c = 'Zeta notes'
            )
        };
        insert testApps;
    }

    // 1. Backward Compatibility: Flat array without pagination parameters
    @isTest
    static void testGetAllApplicationsBackwardCompatible() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode, 'Expected HTTP 200');
        List<Object> results = (List<Object>) JSON.deserializeUntyped(res.responseBody.toString());
        System.assertEquals(6, results.size(), 'Expected all 6 applications returned in flat array');
    }

    // 2. Backward Compatibility with status filter
    @isTest
    static void testGetApplicationsWithStatusFilterBackwardCompatible() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('status', 'Approved');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode, 'Expected HTTP 200');
        List<Object> results = (List<Object>) JSON.deserializeUntyped(res.responseBody.toString());
        System.assertEquals(1, results.size(), 'Expected 1 Approved record');
    }

    // 3. Pagination: First page (page=1, pageSize=2)
    @isTest
    static void testPaginationFirstPage() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('page', '1');
        req.params.put('pageSize', '2');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode, 'Expected HTTP 200');
        Map<String, Object> respMap = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        List<Object> records = (List<Object>) respMap.get('records');
        Map<String, Object> pagination = (Map<String, Object>) respMap.get('pagination');

        System.assertEquals(2, records.size(), 'Expected 2 records on first page');
        System.assertEquals(1, pagination.get('page'), 'Expected page 1');
        System.assertEquals(2, pagination.get('pageSize'), 'Expected pageSize 2');
        System.assertEquals(6, pagination.get('totalRecords'), 'Expected 6 total records');
        System.assertEquals(3, pagination.get('totalPages'), 'Expected 3 total pages');
        System.assertEquals(true, pagination.get('hasNext'), 'Expected hasNext true');
        System.assertEquals(false, pagination.get('hasPrevious'), 'Expected hasPrevious false');
    }

    // 4. Pagination: Second page (page=2, pageSize=2)
    @isTest
    static void testPaginationSecondPage() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('page', '2');
        req.params.put('pageSize', '2');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode, 'Expected HTTP 200');
        Map<String, Object> respMap = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        List<Object> records = (List<Object>) respMap.get('records');
        Map<String, Object> pagination = (Map<String, Object>) respMap.get('pagination');

        System.assertEquals(2, records.size(), 'Expected 2 records on page 2');
        System.assertEquals(2, pagination.get('page'));
        System.assertEquals(true, pagination.get('hasNext'));
        System.assertEquals(true, pagination.get('hasPrevious'));
    }

    // 5. Pagination: Final page (page=3, pageSize=2)
    @isTest
    static void testPaginationFinalPage() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('page', '3');
        req.params.put('pageSize', '2');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode);
        Map<String, Object> respMap = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        List<Object> records = (List<Object>) respMap.get('records');
        Map<String, Object> pagination = (Map<String, Object>) respMap.get('pagination');

        System.assertEquals(2, records.size());
        System.assertEquals(false, pagination.get('hasNext'), 'Expected hasNext false on last page');
        System.assertEquals(true, pagination.get('hasPrevious'), 'Expected hasPrevious true on last page');
    }

    // 6. Pagination + Status Filter (status=New, page=1, pageSize=2)
    @isTest
    static void testPaginationWithStatusFilter() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('status', 'New');
        req.params.put('page', '1');
        req.params.put('pageSize', '2');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode);
        Map<String, Object> respMap = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        List<Object> records = (List<Object>) respMap.get('records');
        Map<String, Object> pagination = (Map<String, Object>) respMap.get('pagination');

        System.assertEquals(2, records.size());
        System.assertEquals(3, pagination.get('totalRecords'), 'Expected 3 New records total');
        System.assertEquals(2, pagination.get('totalPages'), 'Expected 2 total pages for 3 records with pageSize=2');
        System.assertEquals(true, pagination.get('hasNext'));
    }

    // 7. Pagination Default Page (no page, pageSize=2)
    @isTest
    static void testPaginationDefaultPage() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('pageSize', '2');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode);
        Map<String, Object> respMap = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        Map<String, Object> pagination = (Map<String, Object>) respMap.get('pagination');
        System.assertEquals(1, pagination.get('page'), 'Default page should be 1');
    }

    // 8. Pagination Default PageSize (page=1, no pageSize)
    @isTest
    static void testPaginationDefaultPageSize() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('page', '1');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode);
        Map<String, Object> respMap = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        Map<String, Object> pagination = (Map<String, Object>) respMap.get('pagination');
        System.assertEquals(25, pagination.get('pageSize'), 'Default pageSize should be 25');
    }

    // 9. Pagination Max PageSize (pageSize=100)
    @isTest
    static void testPaginationMaxPageSize() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('page', '1');
        req.params.put('pageSize', '100');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode);
        Map<String, Object> respMap = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        List<Object> records = (List<Object>) respMap.get('records');
        System.assertEquals(6, records.size(), 'Should return all 6 records');
    }

    // 10. Invalid Page (page=0, page=-1, page=abc)
    @isTest
    static void testPaginationInvalidPage() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('page', '0');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for page=0');

        req.params.put('page', 'invalid');
        PartnerApplicationRestResource.getApplications();
        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for non-numeric page');
        Test.stopTest();
    }

    // 11. Invalid PageSize (pageSize=0, pageSize=-5, pageSize=abc)
    @isTest
    static void testPaginationInvalidPageSize() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('pageSize', '0');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for pageSize=0');

        req.params.put('pageSize', 'invalid');
        PartnerApplicationRestResource.getApplications();
        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for non-numeric pageSize');
        Test.stopTest();
    }

    // 12. Excessive PageSize (> 100)
    @isTest
    static void testPaginationExcessivePageSize() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('pageSize', '150');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for pageSize > 100');
    }

    // 13. Deep Page / OFFSET Boundary (> 2000)
    @isTest
    static void testPaginationOffsetBoundary() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('page', '100');
        req.params.put('pageSize', '25'); // offset = 99 * 25 = 2475 > 2000
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for offset > 2000');
        Map<String, Object> errMap = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        System.assertEquals('PAGE_OUT_OF_RANGE', errMap.get('error'));
    }

    // 14. Zero matching records
    @isTest
    static void testPaginationZeroRecords() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('status', 'NonExistentStatus');
        req.params.put('page', '1');
        req.params.put('pageSize', '25');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode);
        Map<String, Object> respMap = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        List<Object> records = (List<Object>) respMap.get('records');
        Map<String, Object> pagination = (Map<String, Object>) respMap.get('pagination');

        System.assertEquals(0, records.size());
        System.assertEquals(0, pagination.get('totalRecords'));
        System.assertEquals(0, pagination.get('totalPages'));
        System.assertEquals(false, pagination.get('hasNext'));
        System.assertEquals(false, pagination.get('hasPrevious'));
    }

    // 15. POST create application success
    @isTest
    static void testCreateApplicationSuccess() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'POST';
        
        PartnerApplicationRestResource.ApplicationPayload payload = new PartnerApplicationRestResource.ApplicationPayload();
        payload.applicantName = 'Acme Corp';
        payload.email = 'partner@acme.com';
        payload.requestedAmount = 150000;
        payload.notes = 'Expansion capital';
        
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.createApplication();
        Test.stopTest();

        System.assertEquals(201, res.statusCode, 'Expected HTTP 201 Created');
        Map<String, Object> result = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        System.assertEquals(true, result.get('success'));
        System.assertNotEquals(null, result.get('recordId'));
        System.assertEquals('New', result.get('status'));
        System.assertEquals('Acme Corp', result.get('applicantName'));
    }

    // 16. POST validation failures
    @isTest
    static void testCreateApplicationValidationFailures() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'POST';

        Test.startTest();
        
        // Missing name
        PartnerApplicationRestResource.ApplicationPayload p1 = new PartnerApplicationRestResource.ApplicationPayload();
        p1.email = 'p@a.com';
        p1.requestedAmount = 100;
        req.requestBody = Blob.valueOf(JSON.serialize(p1));
        RestContext.request = req;
        RestContext.response = res;
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode);

        // Missing email
        PartnerApplicationRestResource.ApplicationPayload p2 = new PartnerApplicationRestResource.ApplicationPayload();
        p2.applicantName = 'Acme';
        p2.requestedAmount = 100;
        req.requestBody = Blob.valueOf(JSON.serialize(p2));
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode);

        // Invalid amount (0)
        PartnerApplicationRestResource.ApplicationPayload p3 = new PartnerApplicationRestResource.ApplicationPayload();
        p3.applicantName = 'Acme';
        p3.email = 'p@a.com';
        p3.requestedAmount = 0;
        req.requestBody = Blob.valueOf(JSON.serialize(p3));
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode);

        Test.stopTest();
    }

    // 17. POST empty / null / malformed JSON
    @isTest
    static void testCreateApplicationEdgeCases() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'POST';

        Test.startTest();
        // Null body
        RestContext.request = req;
        RestContext.response = res;
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode);

        // Empty body string
        req.requestBody = Blob.valueOf('');
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode);

        // Malformed JSON
        req.requestBody = Blob.valueOf('{ invalid json');
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode);

        Test.stopTest();
    }
}
