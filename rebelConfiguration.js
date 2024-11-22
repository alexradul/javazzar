const plusProfiles = [
    "javazzar.persistence",
    "javazzar.spring.data", 
    "javazzar.spring", 
    "javazzar.serialization", 
    "javazzar.doc"
];

const isPlusProfile = (profileName) => plusProfiles.indexOf(profileName) !== -1;

exports.isPlusProfile = isPlusProfile;