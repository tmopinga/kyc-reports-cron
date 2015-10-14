module.exports = {
	mongoUrl: 'mongodb://localhost:27017/kycApi',
	validTypes: ['DAY', 'WEEK', 'MONTH'],
  validStatus: ['approved', 'rejected'],
  approver: 'robinsons',
  fields: {
    reference_id: 1,
    first_name: 1,
    last_name: 1,
    middle_name: 1,
    birth_date: 1,
    updated_by: 1,
    created_at: 1,
    remarks: 1,
    status: 1
  },
  sort : { created_at: 1 },
  labels: ['Name', 'Reference Number', 'Date of Birth', 'Updated Date', 'Approver / Updated By', 'Remarks', 'Status'],
  delimiter: ',',
  file_location: './files/',
  file_extension: '.csv'
}