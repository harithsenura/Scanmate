// VULNERABILITY 2: Hardcoded Secret Leak
// CWE-798: Use of Hard-coded Credentials

const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const STRIPE_SECRET = "sk_live_51Mqw23LpQ8rTyU7Xabc123def456ghi789jkl012mno345pqr678stu901vwx";

function authenticateService() {
    console.log("Connecting to AWS with key:", AWS_ACCESS_KEY_ID);
    // Connection logic here...
}

module.exports = { authenticateService };
