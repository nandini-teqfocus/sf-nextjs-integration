@RestResource(urlMapping='/v1/applications/*')
global with sharing class PartnerApplicationRestResource {

    public class ApplicationPayload {
        public String applicantName;
        public String email;
        public Decimal requestedAmount;
        public String notes;
    }

    @HttpGet
    global static void getApplications() {
        RestResponse res = RestContext.response;
        RestRequest req = RestContext.request;
        if (res == null) {
            res = new RestResponse();
            RestContext.response = res;
        }
        res.addHeader('Content-Type', 'application/json');

        try {
            String statusFilter = (req != null && req.params != null) ? req.params.get('status') : null;
            
            List<Partner_Application__c> records;
            if (String.isNotBlank(statusFilter) && statusFilter != 'All') {
                records = [
                    SELECT Id, Name, Applicant_Name__c, Email__c, Status__c, 
                           Requested_Amount__c, Notes__c, CreatedDate, LastModifiedDate
                    FROM Partner_Application__c
                    WHERE Status__c = :statusFilter
                    ORDER BY CreatedDate DESC
                    LIMIT 100
                ];
            } else {
                records = [
                    SELECT Id, Name, Applicant_Name__c, Email__c, Status__c, 
                           Requested_Amount__c, Notes__c, CreatedDate, LastModifiedDate
                    FROM Partner_Application__c
                    ORDER BY CreatedDate DESC
                    LIMIT 100
                ];
            }

            SObjectAccessDecision decision = Security.stripInaccessible(
                AccessType.READABLE,
                records
            );

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(decision.getRecords()));
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => 'Internal Server Error: ' + e.getMessage()
            }));
        }
    }

    @HttpPost
    global static void createApplication() {
        RestResponse res = RestContext.response;
        RestRequest req = RestContext.request;
        if (res == null) {
            res = new RestResponse();
            RestContext.response = res;
        }
        res.addHeader('Content-Type', 'application/json');

        try {
            if (req == null || req.requestBody == null || String.isBlank(req.requestBody.toString())) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Invalid application data: Request body is empty'
                }));
                return;
            }

            ApplicationPayload payload;
            try {
                payload = (ApplicationPayload) JSON.deserialize(req.requestBody.toString(), ApplicationPayload.class);
            } catch (Exception parseEx) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Invalid application data: Malformed JSON payload'
                }));
                return;
            }

            if (payload == null) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Invalid application data: Empty payload'
                }));
                return;
            }

            // Validate Input
            String validationError = validatePayload(payload);
            if (validationError != null) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => validationError
                }));
                return;
            }

            Partner_Application__c newApp = new Partner_Application__c(
                Applicant_Name__c = payload.applicantName,
                Email__c = payload.email,
                Requested_Amount__c = payload.requestedAmount,
                Notes__c = payload.notes,
                Status__c = 'New'
            );

            SObjectAccessDecision decision = Security.stripInaccessible(
                AccessType.CREATABLE,
                new List<Partner_Application__c>{ newApp }
            );

            List<Partner_Application__c> sanitizedRecords = (List<Partner_Application__c>) decision.getRecords();
            if (sanitizedRecords.isEmpty()) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Insufficient permissions to create Partner Application'
                }));
                return;
            }

            insert sanitizedRecords;

            res.statusCode = 201;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'success' => true,
                'recordId' => sanitizedRecords[0].Id
            }));
        } catch (Exception e) {
            res.statusCode = 400;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => 'Error processing application: ' + e.getMessage()
            }));
        }
    }

    private static String validatePayload(ApplicationPayload payload) {
        if (String.isBlank(payload.applicantName)) {
            return 'Applicant name is required';
        }
        if (String.isBlank(payload.email)) {
            return 'Email is required';
        }
        String emailRegex = '^[a-zA-Z0-9._|\\\\%#~`=?&/$^*!}{+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$';
        Pattern emailPattern = Pattern.compile(emailRegex);
        Matcher emailMatcher = emailPattern.matcher(payload.email);
        if (!emailMatcher.matches()) {
            return 'Invalid email format';
        }
        if (payload.requestedAmount == null || payload.requestedAmount <= 0) {
            return 'Requested amount must be a positive number';
        }
        return null;
    }
}
