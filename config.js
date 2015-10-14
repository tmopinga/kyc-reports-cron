module.exports = {
	mongoUrl: 'mongodb://localhost:27017/kycApi',
	validTypes: ['DAY', 'WEEK', 'MONTH'],
  status: ['approved', 'rejected'],
  approver: 'kyc_dev',
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
  labels: {
    name: 'Name',
    reference_id: 'Reference Number',
    birth_date: 'Date of Birth',
    created_at: 'Updated Date',
    updated_by: 'Approver / Updated By',
    remarks: 'Remarks',
    status: 'Status'
  },
  delimiter: ',',
  file_location: './files/',
  file_extension: '.csv'
}