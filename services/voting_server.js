const express = require("express");
const json = require("body-parser").json;
const { verifyProof } = require("@semaphore-protocol/proof");
const {verifySignature,unpackPublicKey,unpackSignature} = require("@zk-kit/eddsa-poseidon")
const cors = require("cors");
const fs = require('fs');


const app = express();
const port = 3002;

app.use(cors());
app.use(json());

let answers = {};
let nullifiers = {};
const filePathVotes = './Votes.json';
const filePathNulifiers = './Nulifiers.json';

function deserializeBigInt(jsonString) {
    return JSON.parse(jsonString, (key, value) =>
        typeof value === "string" && /^[0-9]+$/.test(value) ? BigInt(value) : value
    );
}

function saveToFileSync() {    
    fs.writeFileSync(filePathVotes, JSON.stringify(answers, null, 2), "utf-8");
    fs.writeFileSync(filePathNulifiers, JSON.stringify(nullifiers, null, 2), "utf-8");
    //console.log("Data saved successfully!");
}

function loadFromFile(filePath){
    if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8')) {
        const rawData = fs.readFileSync(filePath, 'utf8');
        try {
            return JSON.parse(rawData);
        } catch (error) {
            console.error("Error parsing JSON:", error);
        }
    } else {
        fs.writeFileSync(filePath, JSON.stringify({}));
    }
}

answers = loadFromFile(filePathVotes);
nullifiers = loadFromFile(filePathNulifiers);

//  --------------------------------------------------------------------------------------------------

// Results
app.post("/submit-survey", async (req, res) => {
    const { ZKP } = req.body;

    //ZKP.message="6";  -> testing invalid proofs (if someone changes the vote)

    const isValid = await verifyProof(ZKP);

        if (isValid) {

            const nulifier = ZKP.nullifier;
            console.log(`${nullifiers[ZKP.scope]}`);
    
            if(!nullifiers[ZKP.scope]){
                nullifiers[ZKP.scope]=[];
            }
            else if(nullifiers[ZKP.scope].includes(nulifier)) {
                return res.status(200).json({
                    message: "You have already submitted the vote .",
                    type: "2"
                });   
            }
            nullifiers[ZKP.scope].push(nulifier);
            if(!answers[ZKP.scope]){
                answers[ZKP.scope] = [];
            }
            answers[ZKP.scope].push(ZKP.message);
            saveToFileSync();
            return res.status(200).json({
                message: "Successfully submitted.",
                type: "3"
            });
        } else {
            return res.status(200).json({ isValid: false, message: 'Proof is invalid.', type:"1" });
        }
   
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
