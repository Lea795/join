let Contacts = [];
let actualContactIndex = 0;

window.addEventListener('resize', () => {
    handleWindowResize( getActualContactIndex() );
});

let colorsArray = [
    "#FF6B6B", "#FF8C42", "#FFA500", "#FFD700", "#FFE600",
    "#B4FF00", "#4CAF50", "#00C853", "#00E5FF", "#00B8D4",
    "#1DE9B6", "#00CFAE", "#00BCD4", "#40C4FF", "#2196F3",
    "#3D5AFE", "#536DFE", "#7C4DFF", "#AB47BC", "#E040FB",
    "#FF4081", "#F50057", "#EC407A", "#FF1744", "#FF5252",
    "#D500F9", "#9C27B0", "#BA68C8", "#E91E63", "#FFB300",
    "#FFC400", "#FF9100", "#FF7043", "#F06292", "#FF6E40",
    "#C51162", "#8E24AA", "#651FFF", "#00BFA5", "#76FF03"
]


function getContacts(data){
    
    fetch('https://joinstorage-ef266-default-rtdb.europe-west1.firebasedatabase.app/contacts.json')
        .then(response => response.json())
        .then(data => {
            Contacts = data;
            renderContacts(data);

            if (Contacts.length > 0) {
                //renderViewCard(0); 
            }
                
        });
    clearViewCard();

    /*versionHandling();*/
    return data;

}


function updateDatabase(data){ 
    fetch('https://joinstorage-ef266-default-rtdb.europe-west1.firebasedatabase.app/contacts.json', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/* Kontaktliste */
function renderContacts(contacts) { 
    let contactCards = '';
    sortContacts(contacts); // Kontakte sortieren
    let oldLetter = ''; // Speichert den vorherigen Buchstaben

    for (let index = 0; index < contacts.length; index++) {
        const contact = contacts[index];
        const initials = getInitials(contact.name);

        const firstLetter = contact.name.charAt(0).toUpperCase(); // Erster Buchstabe des Namens

        // Wenn der Buchstabe wechselt, füge eine neue Überschrift hinzu
        if (oldLetter !== firstLetter) {
            contactCards += `
                <div class="contacts_section_header">
                    <p class="contacts_section_letter">${firstLetter}</p>
                </div>`;
            oldLetter = firstLetter;
        }

        let color = getColor(initials[0]);
        contactCards += getContactCardTamplate(contact.name, contact.mail, initials, index, color);
    }
    document.getElementById("contact_card_section").innerHTML = contactCards;
}

/* Mobile Version */
function MobileVievCard(index){
    
    const contactsListElem = document.getElementById("contacts_list");
    if (contactsListElem) {
        contactsListElem.style.display = "none";
    }

    const addNewContactSectionElem = document.getElementById("add_new_contact_section");
    if (addNewContactSectionElem) {
        addNewContactSectionElem.style.display = "none";
    }

    let viewCardTemp  = getViewCardTemplate(index);
    let contactsContainer = document.getElementById("contactslist_container");
    contactsContainer.innerHTML = viewCardTemp ;
    renderViewCard(index); 
}

/* Desktop Version*/
function renderViewCard(index) {
    const contact = Contacts[index];
    
    let initials = getInitials(contact.name);
    let color = getColor(initials[0]);
    let tempViewCard = getViewCardTemplate(index, color);
    //tempViewCard.innerHTML = "";
    document.getElementById("contactViewCard").innerHTML = tempViewCard;

    document.getElementById("contact_view_avatar_initials").innerText = contact.name
        .split(' ')
        .map(word => word[0].toUpperCase())
        .join('');
    document.getElementById("contact_view_name").innerText = contact.name;
    document.getElementById("contact_view_mail").innerText = contact.mail;
    document.getElementById("contact_view_phone").innerText = contact.phone || 'No phone number available';
}


function getContact(id){
    console.log(Contacts[id]);
}


function createContact() {
    let name = document.getElementById("name_input").value.trim();
    let mail = document.getElementById("mail_input").value.trim();
    let phone = document.getElementById("pohne_input").value.trim();
    if (!name || !mail  || !phone) {
        alert("Bitte fülle die Felder Name, Mail und Pohne aus.")
        return;
    }
    if ( emailIsValid(mail) == false)  {
        alert("Pleas wiret a valid email address.");
        return;
    }

    name = capitalizeWords(name);

    let newContact = {
        name: name,
        mail: mail,
        phone: phone || "No phone number available" 
    };

    Contacts.push(newContact);
    updateDatabase(Contacts);
    renderContacts(Contacts);
    closeContactDialog();

    document.getElementById("name_input").value = "";
    document.getElementById("mail_input").value = "";
    document.getElementById("pohne_input").value = "";
    console.log("Neuer Kontakt hinzugefügt:", newContact);
}


function editContact(id) {
    let name = document.getElementById("name_input").value;
    let mail = document.getElementById("mail_input").value;
    let phone = document.getElementById("pohne_input").value;

    if (!name || !mail  || !phone) {
        alert("EDIT: Bitte fülle die Felder Name, Mail und Pohne aus.")
        return;
    }
    if ( emailIsValid(mail) == false)  {
        alert("Pleas wiret a valid email address.");
        return;
    }
    
    name = capitalizeWords(name);

    let newContact = {
        name: name,
        mail: mail,
        phone: phone || "No phone number available" 
    };
    
    
    Contacts[id] = newContact;

    updateDatabase(Contacts);
    renderContacts(Contacts);
    renderViewCard(id);
    closeContactDialog();

    document.getElementById("name_input").value = "";
    document.getElementById("mail_input").value = "";
    document.getElementById("pohne_input").value = "";
    console.log("Kontakt wurde aktualisiert:", newContact);
}


function emailIsValid (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}


function deleteContact(id) {
    if (id < 0 || id >= Contacts.length) {
        console.error("Ungültige ID:", id);
        return;
    }
    Contacts.splice(id, 1);
    updateDatabase(Contacts);
    renderContacts(Contacts);

    if (Contacts.length > 0) {
        renderViewCard(0); 
    } else {
        document.getElementById("contact_view_avatar_initials").innerText = "";
        document.getElementById("contact_view_name").innerText = "";
        document.getElementById("contact_view_mail").innerText = "";
        document.getElementById("contact_view_phone").innerText = "";
    }
    alert("Contact deleted");
    clearViewCard();
}


function clearViewCard()
{
    document.getElementById("contactViewCard").innerHTML = "";
}


function configEditDlgBox(id){

    let kindOFEdit = "editContact";
    if(id < 0) kindOFEdit = "createContact";

    let btnText ="";
    let kindOfDlg_Text = "";
    let functionName = "";

    switch(kindOFEdit){
        case "editContact":
                document.getElementById("Kind_Of_Dlg").innerHTML = "Edit contact";
                btnText = "Save";
                functionName = "editContact(" + id + ")";

                let oldContactData = Contacts[id];

                document.getElementById("name_input").value = oldContactData.name; // Contacts[id].name;
                document.getElementById("mail_input").value = oldContactData.mail //Contacts[id].mail;
                document.getElementById("pohne_input").value = oldContactData.phone; //Contacts[id].phone;

            break;

        case "createContact":
                document.getElementById("Kind_Of_Dlg").innerHTML = "Add contact";
                btnText = "Create";
                functionName = "createContact()";
            break;

        default:
            break;
    }

    let btnHtml = `
        <button class="create_btn" id="id_Edit_Btn" onclick = "${functionName}">
            <span id="id_Edit_Btn_Text">${btnText}</span>
            <img class="create_btn_img" src="./assets/img/create_contact_btn.png" alt="create button">
        </button>`;

    document.getElementById("id_Edit_Btn").innerHTML = btnHtml;

}


function openContactDialog(id){
    //index > 0 entspricht Contacs editieren
    //index <0 entspricht neuen Kontakt erstellen

    configEditDlgBox(id);

    document.getElementById("add_new_contact_ov_section").style.display = "flex";
}


function closeContactDialog(){

    document.getElementById("add_new_contact_ov_section").style.display = "none";
    console.log("closeContactDialog aufgerufen");

    // dialog beim schliesen lleeren
}

function getInitials(name)
{
    const initials = name
        .trim()
        .split(' ')
        .filter(word => word.length > 0)
        .map(word => word[0].toUpperCase()); 
    return initials;
}

function sortContacts(contacts){ //sort contacts by name
    contacts.sort((a, b) => a.name.localeCompare(b.name));
    Contacts = contacts;
}


function getFirstLetter(name, oldLetter, change){ //get first letter of name

    const firstLetter = name.charAt(0);

    if (oldLetter !== firstLetter) {
        change = true;
    }
    else {
        change = false;
    }
    oldLetter = firstLetter;

    return firstLetter;
}

/* return:
    1 = desktop (default value)
    2 = mobile
    3 = tablet
    4 = other
*/
function getViewMode()
{
    let viewMode = 1;
    
    if (window.innerWidth < 825) {
        viewMode = 2;
    }

    return viewMode;
}

let bigWindowIsRendered = false;

function proofVersion(index){

    setActualContactIndex(index);
    let version = getViewMode();

    switch (version) {
        case 1:
            renderViewCard(index)
            break;
        case 2:
            MobileVievCard(index)
            break;
        default:
            break;
    }
}

function handleWindowResize(index){

    let idx = getActualContactIndex();

    if (window.innerWidth > 825) {

        //if (bigWindowIsRendered == false) {
            renderContacts(Contacts);


            if (idx < 0) {
                // Clear the view card
                clearViewCard();
            }else
            {
                renderViewCard(idx);
            }
            bigWindowIsRendered = true;
      //  }

    }else {
        document.getElementById("contactViewCard").style.display = "none";
        renderContacts(Contacts);
        bigWindowIsRendered = false;
    }

}


function getColor(firstLetter){

    let text = "";
    text = String(firstLetter).toUpperCase();

    let colorIndex = text.charCodeAt(0) - 65;

    return colorsArray[colorIndex];
}


function capitalizeWords(Sentence)
{
    return Sentence.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
}





function setActualContactIndex(index){
    actualContactIndex = index;
    return actualContactIndex;
}


function getActualContactIndex(){
    return actualContactIndex;
}   

function showContactList() {
  document.getElementById("contactslist_container").style.display = "";
}