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
                Notes__c = 'Alpha application notes'
            ),
            new Partner_Application__c(
                Applicant_Name__c = 'Partner Beta',
                Email__c = 'beta@example.com',
                Status__c = 'Approved',
                Requested_Amount__c = 75000,
                Notes__c = 'Beta application notes'
            ),
            new Partner_Application__c(
                Applicant_Name__c = 'Partner Gamma',
                Email__c = 'gamma@example.com',
                Status__c = 'Under Review',
                Requested_Amount__c = 100000,
                Notes__c = 'Gamma application notes'
            )
        };
        insert testApps;
    }

    @isTest
    static void testGetAllApplications() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode, 'Expected HTTP 200 for GET all applications');
        String responseBody = res.responseBody.toString();
        List<Object> results = (List<Object>) JSON.deserializeUntyped(responseBody);
        System.assertEquals(3, results.size(), 'Expected 3 applications returned');
    }

    @isTest
    static void testGetApplicationsWithStatusFilter() {
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

        System.assertEquals(200, res.statusCode, 'Expected HTTP 200 for filtered GET');
        String responseBody = res.responseBody.toString();
        List<Object> results = (List<Object>) JSON.deserializeUntyped(responseBody);
        System.assertEquals(1, results.size(), 'Expected 1 Approved application');
        
        Map<String, Object> firstRecord = (Map<String, Object>) results[0];
        System.assertEquals('Approved', firstRecord.get('Status__c'));
        System.assertEquals('Partner Beta', firstRecord.get('Applicant_Name__c'));
    }

    @isTest
    static void testGetApplicationsWithAllFilter() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'GET';
        req.params.put('status', 'All');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.getApplications();
        Test.stopTest();

        System.assertEquals(200, res.statusCode, 'Expected HTTP 200 for status=All');
        List<Object> results = (List<Object>) JSON.deserializeUntyped(res.responseBody.toString());
        System.assertEquals(3, results.size(), 'Expected all 3 applications returned');
    }

    @isTest
    static void testCreateApplicationSuccess() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'POST';

        PartnerApplicationRestResource.ApplicationPayload payload = new PartnerApplicationRestResource.ApplicationPayload();
        payload.applicantName = 'Acme Partner';
        payload.email = 'partner@acme.com';
        payload.requestedAmount = 125000;
        payload.notes = 'POC submission test';

        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.createApplication();
        Test.stopTest();

        System.assertEquals(201, res.statusCode, 'Expected HTTP 201 Created');
        Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.responseBody.toString());
        System.assertEquals(true, responseMap.get('success'));
        String recordId = (String) responseMap.get('recordId');
        System.assertNotEquals(null, recordId, 'Expected recordId in response');

        Partner_Application__c insertedApp = [
            SELECT Id, Applicant_Name__c, Email__c, Status__c, Requested_Amount__c, Notes__c
            FROM Partner_Application__c
            WHERE Id = :recordId
        ];
        System.assertEquals('Acme Partner', insertedApp.Applicant_Name__c);
        System.assertEquals('partner@acme.com', insertedApp.Email__c);
        System.assertEquals('New', insertedApp.Status__c, 'Status must default to New');
        System.assertEquals(125000, insertedApp.Requested_Amount__c);
        System.assertEquals('POC submission test', insertedApp.Notes__c);
    }

    @isTest
    static void testCreateApplicationEmptyBody() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf('');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.createApplication();
        Test.stopTest();

        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for empty body');
    }

    @isTest
    static void testCreateApplicationNullJson() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf('null');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.createApplication();
        Test.stopTest();

        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for null JSON payload');
    }

    @isTest
    static void testCreateApplicationMalformedJson() {
        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf('{ invalid json string ...');
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.createApplication();
        Test.stopTest();

        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for malformed JSON');
    }

    @isTest
    static void testCreateApplicationValidationFailures() {
        // Test 1: Missing Applicant Name
        PartnerApplicationRestResource.ApplicationPayload payload = new PartnerApplicationRestResource.ApplicationPayload();
        payload.applicantName = '';
        payload.email = 'test@example.com';
        payload.requestedAmount = 5000;

        RestRequest req = new RestRequest();
        RestResponse res = new RestResponse();
        req.requestURI = '/services/apexrest/v1/applications';
        req.httpMethod = 'POST';
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        RestContext.request = req;
        RestContext.response = res;

        Test.startTest();
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for missing applicant name');

        // Test 2: Missing Email
        payload.applicantName = 'Valid Name';
        payload.email = '';
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for missing email');

        // Test 3: Invalid Email Format
        payload.email = 'not-an-email';
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for invalid email format');

        // Test 4: Negative/Zero/Null Amount
        payload.email = 'valid@example.com';
        payload.requestedAmount = -100;
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for negative amount');

        payload.requestedAmount = 0;
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for zero amount');

        payload.requestedAmount = null;
        req.requestBody = Blob.valueOf(JSON.serialize(payload));
        PartnerApplicationRestResource.createApplication();
        System.assertEquals(400, res.statusCode, 'Expected HTTP 400 for null amount');
        Test.stopTest();
    }
}
