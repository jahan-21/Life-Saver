// Blood group constants and utilities

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const BLOOD_GROUP_INFO = {
    'A+': {
        name: 'A Positive',
        canDonateTo: ['A+', 'AB+'],
        canReceiveFrom: ['A+', 'A-', 'O+', 'O-'],
        frequency: '34%',
        description: 'Second most common blood type'
    },
    'A-': {
        name: 'A Negative',
        canDonateTo: ['A+', 'A-', 'AB+', 'AB-'],
        canReceiveFrom: ['A-', 'O-'],
        frequency: '6%',
        description: 'Can donate to both A+ and A- recipients'
    },
    'B+': {
        name: 'B Positive',
        canDonateTo: ['B+', 'AB+'],
        canReceiveFrom: ['B+', 'B-', 'O+', 'O-'],
        frequency: '9%',
        description: 'Less common but important blood type'
    },
    'B-': {
        name: 'B Negative',
        canDonateTo: ['B+', 'B-', 'AB+', 'AB-'],
        canReceiveFrom: ['B-', 'O-'],
        frequency: '2%',
        description: 'Rare blood type, high demand'
    },
    'AB+': {
        name: 'AB Positive',
        canDonateTo: ['AB+'],
        canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        frequency: '3%',
        description: 'Universal plasma donor, can receive from all'
    },
    'AB-': {
        name: 'AB Negative',
        canDonateTo: ['AB+', 'AB-'],
        canReceiveFrom: ['A-', 'B-', 'AB-', 'O-'],
        frequency: '1%',
        description: 'Rarest blood type'
    },
    'O+': {
        name: 'O Positive',
        canDonateTo: ['A+', 'B+', 'AB+', 'O+'],
        canReceiveFrom: ['O+', 'O-'],
        frequency: '38%',
        description: 'Most common blood type'
    },
    'O-': {
        name: 'O Negative',
        canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
        canReceiveFrom: ['O-'],
        frequency: '7%',
        description: 'Universal donor, can donate to all'
    }
};

export const DONATION_TYPES = [
    {
        value: 'whole_blood',
        label: 'Whole Blood',
        description: 'Complete blood donation including all components',
        duration: '8-10 minutes',
        interval: 56, // days
        volume: '450ml'
    },
    {
        value: 'platelets',
        label: 'Platelets',
        description: 'Only platelets are collected, other components returned',
        duration: '90-120 minutes',
        interval: 7, // days
        volume: '200-400ml'
    },
    {
        value: 'plasma',
        label: 'Plasma',
        description: 'Only plasma is collected, other components returned',
        duration: '60-90 minutes',
        interval: 28, // days
        volume: '600-880ml'
    },
    {
        value: 'red_cells',
        label: 'Red Blood Cells',
        description: 'Double red cell donation using apheresis',
        duration: '25-35 minutes',
        interval: 112, // days
        volume: '2 units'
    }
];

export const DONATION_REQUIREMENTS = [
    {
        category: 'Age',
        requirement: '18-65 years old',
        description: 'Must be at least 18 and not older than 65'
    },
    {
        category: 'Weight',
        requirement: 'Minimum 50kg (110 lbs)',
        description: 'Must weigh at least 50kg to safely donate'
    },
    {
        category: 'Health',
        requirement: 'Good general health',
        description: 'No recent illness, infections, or medications that defer donation'
    },
    {
        category: 'Iron Level',
        requirement: 'Adequate hemoglobin',
        description: 'Hemoglobin level will be tested before donation'
    },
    {
        category: 'Lifestyle',
        requirement: 'Low risk behavior',
        description: 'No high-risk activities that could affect blood safety'
    }
];

export const DEFERRAL_PERIODS = {
    'tattoo': 12, // months
    'piercing': 3, // months
    'travel_malaria': 12, // months
    'surgery_minor': 1, // months
    'surgery_major': 6, // months
    'pregnancy': 6, // months after delivery
    'medication_antibiotics': 1, // weeks
    'vaccination_live': 4, // weeks
    'vaccination_killed': 0, // no deferral
    'dental_work': 1, // days
    'cold_flu': 7 // days after recovery
};

export const BLOOD_FACTS = [
    'One blood donation can save up to three lives',
    'The human body contains about 10-12 pints of blood',
    'Blood makes up about 7% of your body weight',
    'Red blood cells live for about 120 days',
    'Your body replaces donated blood within 24-48 hours',
    'Type O negative is the universal donor blood type',
    'Type AB positive is the universal plasma donor',
    'Only 3% of age-eligible people donate blood yearly',
    'Blood cannot be manufactured - it can only come from donors',
    'Every 2 seconds someone in the world needs blood'
];

export const MYTHS_AND_FACTS = [
    {
        myth: 'Blood donation makes you weak',
        fact: 'Your body quickly replenishes donated blood. Most people feel normal within hours.'
    },
    {
        myth: 'You can get diseases from donating blood',
        fact: 'All equipment is sterile and used only once. There is no risk of infection.'
    },
    {
        myth: 'Vegetarians cannot donate blood',
        fact: 'Vegetarians can donate as long as they maintain adequate iron levels.'
    },
    {
        myth: 'You need to fast before donating',
        fact: 'You should eat a healthy meal before donating to maintain blood sugar levels.'
    },
    {
        myth: 'Blood donation takes too much time',
        fact: 'The actual donation takes only 8-10 minutes, total process is about 45-60 minutes.'
    }
];

export const getCompatibleDonors = (bloodGroup) => {
    return BLOOD_GROUP_INFO[bloodGroup]?.canReceiveFrom || [];
};

export const getCompatibleRecipients = (bloodGroup) => {
    return BLOOD_GROUP_INFO[bloodGroup]?.canDonateTo || [];
};

export const isCompatibleDonor = (donorBloodGroup, recipientBloodGroup) => {
    const compatibleDonors = getCompatibleDonors(recipientBloodGroup);
    return compatibleDonors.includes(donorBloodGroup);
};
