@RestResource(urlMapping='/v1/applications/*')
global with sharing class PartnerApplicationRestResource {

    public class ApplicationPayload {
        public String applicantName;
        public String email;
        public Decimal requestedAmount;
        public String notes;
    }

    public class PaginationMetadata {
        public Integer page;
        public Integer pageSize;
        public Integer totalRecords;
        public Integer totalPages;
        public Boolean hasNext;
        public Boolean hasPrevious;

        public PaginationMetadata(Integer page, Integer pageSize, Integer totalRecords, Integer totalPages, Boolean hasNext, Boolean hasPrevious) {
            this.page = page;
            this.pageSize = pageSize;
            this.totalRecords = totalRecords;
            this.totalPages = totalPages;
            this.hasNext = hasNext;
            this.hasPrevious = hasPrevious;
        }
    }

    public class PaginatedResponse {
        public List<SObject> records;
        public PaginationMetadata pagination;

        public PaginatedResponse(List<SObject> records, PaginationMetadata pagination) {
            this.records = records;
            this.pagination = pagination;
        }
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
            String pageParam = (req != null && req.params != null) ? req.params.get('page') : null;
            String pageSizeParam = (req != null && req.params != null) ? req.params.get('pageSize') : null;

            Boolean isPaginatedRequest = (pageParam != null || pageSizeParam != null);

            // If not a paginated request, preserve backward-compatible flat array response (LIMIT 100)
            if (!isPaginatedRequest) {
                List<Partner_Application__c> records;
                if (String.isNotBlank(statusFilter) && statusFilter != 'All') {
                    records = [
                        SELECT Id, Name, Applicant_Name__c, Email__c, Status__c, 
                               Requested_Amount__c, Notes__c, CreatedDate, LastModifiedDate
                        FROM Partner_Application__c
                        WHERE Status__c = :statusFilter
                        ORDER BY CreatedDate DESC, Id DESC
                        LIMIT 100
                    ];
                } else {
                    records = [
                        SELECT Id, Name, Applicant_Name__c, Email__c, Status__c, 
                               Requested_Amount__c, Notes__c, CreatedDate, LastModifiedDate
                        FROM Partner_Application__c
                        ORDER BY CreatedDate DESC, Id DESC
                        LIMIT 100
                    ];
                }

                SObjectAccessDecision decision = Security.stripInaccessible(
                    AccessType.READABLE,
                    records
                );

                res.statusCode = 200;
                res.responseBody = Blob.valueOf(JSON.serialize(decision.getRecords()));
                return;
            }

            // Parse and validate pagination parameters
            Integer page = 1;
            if (String.isNotBlank(pageParam)) {
                try {
                    page = Integer.valueOf(pageParam);
                } catch (Exception ex) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'error' => 'INVALID_PARAMETER',
                        'message' => 'Page parameter must be a valid integer.'
                    }));
                    return;
                }
            }

            if (page < 1) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'INVALID_PARAMETER',
                    'message' => 'Page parameter must be greater than or equal to 1.'
                }));
                return;
            }

            Integer pageSize = 25;
            if (String.isNotBlank(pageSizeParam)) {
                try {
                    pageSize = Integer.valueOf(pageSizeParam);
                } catch (Exception ex) {
                    res.statusCode = 400;
                    res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                        'error' => 'INVALID_PARAMETER',
                        'message' => 'PageSize parameter must be a valid integer.'
                    }));
                    return;
                }
            }

            if (pageSize < 1) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'INVALID_PARAMETER',
                    'message' => 'PageSize parameter must be greater than or equal to 1.'
                }));
                return;
            }

            if (pageSize > 100) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'INVALID_PARAMETER',
                    'message' => 'PageSize parameter cannot exceed 100.'
                }));
                return;
            }

            Integer offset = (page - 1) * pageSize;
            if (offset > 2000) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'PAGE_OUT_OF_RANGE',
                    'message' => 'The requested page exceeds the supported pagination depth (SOQL offset limit of 2000 records). Please refine your filter criteria.'
                }));
                return;
            }

            // Calculate total matching records with identical filter
            Integer totalRecords;
            if (String.isNotBlank(statusFilter) && statusFilter != 'All') {
                totalRecords = [SELECT count() FROM Partner_Application__c WHERE Status__c = :statusFilter];
            } else {
                totalRecords = [SELECT count() FROM Partner_Application__c];
            }

            Integer totalPages = (totalRecords == 0) ? 0 : (Integer) Math.ceil((Decimal) totalRecords / pageSize);
            Boolean hasNext = page < totalPages;
            Boolean hasPrevious = (page > 1) && (totalRecords > 0);

            List<Partner_Application__c> records;
            if (String.isNotBlank(statusFilter) && statusFilter != 'All') {
                records = [
                    SELECT Id, Name, Applicant_Name__c, Email__c, Status__c, 
                           Requested_Amount__c, Notes__c, CreatedDate, LastModifiedDate
                    FROM Partner_Application__c
                    WHERE Status__c = :statusFilter
                    ORDER BY CreatedDate DESC, Id DESC
                    LIMIT :pageSize
                    OFFSET :offset
                ];
            } else {
                records = [
                    SELECT Id, Name, Applicant_Name__c, Email__c, Status__c, 
                           Requested_Amount__c, Notes__c, CreatedDate, LastModifiedDate
                    FROM Partner_Application__c
                    ORDER BY CreatedDate DESC, Id DESC
                    LIMIT :pageSize
                    OFFSET :offset
                ];
            }

            SObjectAccessDecision decision = Security.stripInaccessible(
                AccessType.READABLE,
                records
            );

            PaginationMetadata meta = new PaginationMetadata(page, pageSize, totalRecords, totalPages, hasNext, hasPrevious);
            PaginatedResponse responseDto = new PaginatedResponse(decision.getRecords(), meta);

            res.statusCode = 200;
            res.responseBody = Blob.valueOf(JSON.serialize(responseDto));
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
            if (req == null || req.requestBody == null) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Request body cannot be empty'
                }));
                return;
            }

            String bodyString = req.requestBody.toString();
            if (String.isBlank(bodyString)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Request body cannot be empty'
                }));
                return;
            }

            ApplicationPayload payload;
            try {
                payload = (ApplicationPayload) JSON.deserialize(bodyString, ApplicationPayload.class);
            } catch (Exception jsonEx) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Malformed JSON payload: ' + jsonEx.getMessage()
                }));
                return;
            }

            if (payload == null) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Invalid application payload'
                }));
                return;
            }

            // Validation
            if (String.isBlank(payload.applicantName)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Applicant Name is required'
                }));
                return;
            }

            if (String.isBlank(payload.email)) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Email is required'
                }));
                return;
            }

            if (payload.requestedAmount == null || payload.requestedAmount <= 0) {
                res.statusCode = 400;
                res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                    'error' => 'Requested Amount must be a positive number'
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

            Partner_Application__c insertedApp = [
                SELECT Id, Name, Status__c, Applicant_Name__c, CreatedDate
                FROM Partner_Application__c
                WHERE Id = :sanitizedRecords[0].Id
                LIMIT 1
            ];

            res.statusCode = 201;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, Object>{
                'success' => true,
                'recordId' => insertedApp.Id,
                'applicationNumber' => insertedApp.Name,
                'status' => insertedApp.Status__c,
                'applicantName' => insertedApp.Applicant_Name__c,
                'createdDate' => insertedApp.CreatedDate
            }));
        } catch (Exception e) {
            res.statusCode = 500;
            res.responseBody = Blob.valueOf(JSON.serialize(new Map<String, String>{
                'error' => 'Internal Server Error: ' + e.getMessage()
            }));
        }
    }
}
