const inputs = document.querySelectorAll(".input");

function addcl(){
	let parent = this.parentNode.parentNode;
	parent.classList.add("focus");
}

function remcl(){
	let parent = this.parentNode.parentNode;
	if(this.value == ""){
		parent.classList.remove("focus");
	}
}


inputs.forEach(input => {
	input.addEventListener("focus", addcl);
	input.addEventListener("blur", remcl);
});



var user_array = [
    {
        username : "tijana",
        password : "tijana123"
    },
	{
        username : "tina",
        password : "tina123"
    },
	{
        username : "viki",
        password : "viki123"
    }

]



function initialize() {
	localStorage.clear();

	/*localStorage.removeItem("users");*/

    localStorage.setItem("users", JSON.stringify(user_array));
}

window.initialize=initialize;


function login_function(event) {

	event.preventDefault();
    let username = document.getElementById("login_username").value;
    let password = document.getElementById("login_password").value;
    
    let userFound = false; 

    for (let i = 0; i < user_array.length; i++) {
        if (username == user_array[i].username) {
            userFound = true; 
            if (password == user_array[i].password) {

                window.location.href = "apply.html";
                sessionStorage.setItem("loggedIn", JSON.stringify({username:user_array[i].username,password:user_array[i].password}));  
                return;  
            } else {
                showMessage(1,"Warning: Wrong input data!")
                return;  
            }
        }
    }
    
    
    if (!userFound) {
        showMessage(1,"Warning: Wrong input data!")
    }
}

window.login_function=login_function;


/* alert popup js */


function showMessage(type, message) {
	if (type==1) {
	    $('.alert').addClass("show");
		$('.alert').removeClass("hide");
		$('.alert').removeClass("error-col");
        $('.alert').removeClass("success-col");
		$('.alert').addClass("showAlert");
		$('.msg').html(message);
		$(".alert").addClass("warning-col");
  
		setTimeout(function(){
			$('.alert').removeClass("show");
			$('.alert').addClass("hide");
		}, 5000);
	}
    if(type==2){
        $('.alert').addClass("show");
        $('.alert').removeClass("hide");
        $('.alert').removeClass("warning-col");
        $('.alert').removeClass("success-col");
        $('.alert').addClass("showAlert");
        $('.msg').html(message);
        $(".alert").addClass("error-col");

        setTimeout(function(){
            $('.alert').removeClass("show");
            $('.alert').addClass("hide");
        }, 5000);

    } 
    if(type==3){
        $('.alert').addClass("show");
        $('.alert').removeClass("hide");
        $('.alert').removeClass("error-col");
        $('.alert').removeClass("warning-col");
        $('.alert').addClass("showAlert");
        $('.msg').html(message);
        $(".alert").addClass("success-col");

        setTimeout(function(){
            $('.alert').removeClass("show");
            $('.alert').addClass("hide");
        }, 5000);

    } 
  }


/* apply page */

function downloadJSONFile(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    
    requestAnimationFrame(() => {
        a.click();
        document.body.removeChild(a);
    });

    // Relese URL after 1s
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

window.downloadJSONFile=downloadJSONFile;

async function generateKey(salt) {
    var user = JSON.parse(sessionStorage.getItem("loggedIn"));
    if(!user){
        return;
    }
    const data = new TextEncoder().encode(user.username + user.password + salt);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, "0")).join("");
}

window.generateKey=generateKey;

import { Identity } from "https://cdn.jsdelivr.net/npm/@semaphore-protocol/identity@4.8.2/+esm"

async function apply_function(){


    const selectElement = document.getElementById('course-select');
    const selectedOption = selectElement.options[selectElement.selectedIndex];

    if (!selectedOption || selectedOption.disabled) {
        showMessage(2,"ERROR: Select A Valid Course!");
        return;
    }
    
    generateKey(selectedOption.value).then(async hash=>{
        if(!hash){
            showMessage(2,"You are not logged in");
            return;
        }
        const identity = new Identity(hash);

        const data = {subject:selectedOption.value, commitment: identity.commitment.toString()};

        try {
            const response = await fetch("http://localhost:3001/register", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }) 
            .then(response=>{
                if(response.status==401){
                    showMessage(2,"Already registered for this subject.");
                    return;     
                }
                localStorage.setItem('showPopupApply', 'true');})
            } catch (error) {
                console.error('Error:', error);
                showMessage(2,"An error occurred. Please try again.");
            }
    });
}

window.apply_function = apply_function;


/* survey page */


const radios = document.querySelectorAll('input[name="rate"]');

import { generateProof } from "https://cdn.jsdelivr.net/npm/@semaphore-protocol/proof@4.8.2/+esm"
import { Group } from "https://cdn.jsdelivr.net/npm/@semaphore-protocol/group@4.8.2/+esm"
import {signMessage, packSignature, packPublicKey} from "https://cdn.jsdelivr.net/npm/@zk-kit/eddsa-poseidon/+esm"

function send_function(){

    const selectElement = document.getElementById('course-select');
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    if (!selectedOption || selectedOption.disabled) {
        showMessage(2,"ERROR: Select A Valid Course!");
        return;
    }

    let selectedRating = null;
    radios.forEach(radio => {
        if(radio.checked){
            selectedRating = radio.value;
        }
    });

    if(!selectedRating){
        showMessage(1,"You didn't fill out the survey");
        return;
    }

    const subject = selectedOption.value;
    generateKey(selectedOption.value).then(async hash=>{
        if(!hash){
            showMessage(2,"You are not logged in");
            return;
        }
        const identity = new Identity(hash);

        try {
            const response = fetch("http://localhost:3001/members", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            .then(response => response.json())
            .then(async data => {
            if(!data.merkleMembers[subject]){
                showMessage(2,"You are not registrated for this subject");
                return;
            }

            var group = new Group();
            data.merkleMembers[subject]._nodes.forEach(member => group.addMember(BigInt(member)))
            
            if(group.indexOf(identity.commitment)== -1){
                showMessage(2,"You are not registrated for this subject");
                return;
            }

            const proof = await generateProof(identity,group,selectedRating,subject);

            const params = {
                ZKP : proof,
            }
            const response1 = fetch("http://localhost:3002/submit-survey", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
            })
            .then(response1 => response1.json())
            .then(data1 => { 
                if(data1.type=="1"){
                    showMessage(1,data1.message);
                }
                else if(data1.type=="2"){
                    showMessage(2,data1.message);
                }
                else{
                    localStorage.setItem('showPopupSurvey', 'true');
                }
            })    
            })
        } catch (error) {
            console.error('Error:', error);
            showMessage(2,"An error occurred. Please try again.");
        }  
    });

}

window.send_function=send_function;

if (localStorage.getItem('showPopupSurvey') === 'true') {
    showMessage(3,"Successfully submitted.");  
    localStorage.removeItem('showPopupSurvey');  
}
if (localStorage.getItem('showPopupApply') === 'true') {
    showMessage(3,"Successfully registered.");  
    localStorage.removeItem('showPopupApply');  
}





