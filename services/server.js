const express = require("express");
const json = require("body-parser").json;
const { Group } = require("@semaphore-protocol/group");
const cors = require("cors");
const fs = require('fs');

const filePath = './Merkle.json';
const app = express();
const port = 3001;

app.use(cors());
app.use(json());


let subjectsMerkleTrees = {}; 

// Transforming Merkle groups for saving in file
function transform(){
    const saveData = {};
    for (const [subject, group] of Object.entries(subjectsMerkleTrees)) {
        saveData[subject] = {
        _nodes: group.members.map(member => member.toString())
        };
    } 
    return saveData;     
}


function saveMerkleTreesToFile() { 
    fs.writeFileSync(filePath, JSON.stringify(transform(), null, 2), "utf-8");
    console.log("Data saved successfully!");
}

// Retrive groups from file or initialize empty file
if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8')) {
    const rawData = fs.readFileSync(filePath, 'utf8');
    try {
        data = JSON.parse(rawData);
        for (const [subject, groupData] of Object.entries(data)) {
            const group = new Group();
            groupData._nodes.forEach(member => group.addMember(BigInt(member))); 
            subjectsMerkleTrees[subject] = group;
        }
    } catch (error) {
        console.error("Error parsing JSON:", error);
    }
} else {
    // file doesn't exist or it's empty
    fs.writeFileSync(filePath, JSON.stringify(subjectsMerkleTrees));
}

//  --------------------------------------------------------------------------------------------------

// Fetching members
app.post("/members", (req, res) => {

    const members = transform();
    //console.log(`members=${JSON.stringify(members)}`);

    res.status(200).json({
        merkleMembers: members,
    });
});


//  --------------------------------------------------------------------------------------------------

// Registration for subject
app.post("/register", (req, res) => {
    const { subject, commitment } = req.body;
    console.log(`Received: commitment=${commitment}`);

    if (!subjectsMerkleTrees[subject]) {
        subjectsMerkleTrees[subject] = new Group();
    }

    const group = subjectsMerkleTrees[subject];

    if (group.indexOf(BigInt(commitment))!= -1) {
        return res.status(401).json({ message: "Already registered for this subject." });
    }

    group.addMember(BigInt(commitment));
    // merkleProof = group.generateMerkleProof(group.indexOf(BigInt(commitment)));

    saveMerkleTreesToFile();

    res.status(200).json({
        message: "Successfully registered for this subject.",
    });
});

//   --------------------------------------------------------------------------------------------------

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
