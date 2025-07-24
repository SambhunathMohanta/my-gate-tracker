// All imports MUST be at the very top of the file.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Your new, correct Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA_9LWNHTUYjW9o5ZgBoEfQqdtYhIUIX0s",
    authDomain: "gate-tracker-final.firebaseapp.com",
    projectId: "gate-tracker-final",
    storageBucket: "gate-tracker-final.appspot.com",
    messagingSenderId: "586102213734",
    appId: "1:586102213734:web:88fa9b3a3f0e421b9131a7"
};

// --- DATA CONFIGURATION ---
const SUBJECTS = [
    'NT', 'S & S', 'AEC', 'DE', 'CS', 'EMT',
    'EEM', 'EM I & II', 'PS', 'PE', 'MATH', 'GA'
];

const TASK_COLUMNS = [
    'Videos', 'Notes', 'Book Examples', 'DPPs', 'Workbook Exercises',
    'PYQs', 'Test Series', 'Bites & Bytes', 'ISRO/ESE PYQs',
    'Revision 1', 'Revision 2', 'ME Short Notes'
];

const TOPICS = {
    'NT': ['Basics', 'Theorems', 'Transient Analysis', 'Two-Port Networks', 'AC Analysis'],
    'S & S': ['Signal Types', 'LTI Systems', 'Fourier Series', 'Fourier Transform', 'Laplace Transform', 'Z-Transform'],
    'AEC': ['Diodes', 'BJT', 'FET/MOSFET', 'Op-Amps', 'Oscillators'],
    'DE': ['Number Systems', 'Logic Gates', 'Combinational Circuits', 'Sequential Circuits', 'ADC/DAC'],
    'CS': ['AM/FM', 'Sampling', 'PCM/DM', 'Digital Modulation', 'Information Theory'],
    'EMT': ['Vector Calculus', 'Electrostatics', 'Magnetostatics', 'Maxwell\'s Equations', 'Wave Propagation'],
    'EEM': ['Basics of Measurement', 'Bridges and Potentiometers', 'Measuring Instruments', 'CRO', 'Transducers'],
    'EM I & II': ['Transformers', 'DC Machines', 'Induction Machines', 'Synchronous Machines'],
    'PS': ['Power Generation', 'Transmission & Distribution', 'Fault Analysis', 'Stability', 'Load Flow'],
    'PE': ['Power Diodes', 'Thyristors', 'Choppers', 'Inverters', 'Drives'],
    'MATH': ['Linear Algebra', 'Calculus', 'Differential Equations', 'Complex Variables', 'Probability'],
    'GA': ['Verbal Ability', 'Numerical Ability', 'Logical Reasoning', 'Data Interpretation']
};

// --- FIREBASE INITIALIZATION ---
let app, db, auth, userId;
let unsubscribeSnapshot = null;

// --- DOM ELEMENTS ---
const homePage = document.getElementById('home-page');
const subjectPage = document.getElementById('subject-page');
const subjectGrid = document.getElementById('subject-grid');
const backButton = document.getElementById('back-button');
const subjectTitle = document.getElementById('subject-title');
const subjectTable = document.getElementById('subject-table');
const tableContainer = document.getElementById('table-container');
const loader = document.getElementById('loader');

// --- APPLICATION LOGIC ---

async function initializeAppLogic() {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);

        onAuthStateChanged(auth, (user) => {
            if (user) {
                userId = user.uid;
                console.log("User authenticated with UID:", userId);
                renderHomePage();
            } else {
                console.log("User not signed in, attempting anonymous sign-in.");
                signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
            }
        });
    } catch (error) {
        console.error("Firebase Initialization Error:", error);
        document.getElementById('main-content').innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert"><strong class="font-bold">Error!</strong> <span class="block sm:inline">Could not connect to the database.</span></div>`;
    }
}

function renderHomePage() {
    subjectGrid.innerHTML = '';
    SUBJECTS.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-purple-50 dark:hover:bg-gray-700';
        card.innerHTML = `<h3 class="text-lg font-bold text-center text-purple-700 dark:text-purple-300">${subject}</h3>`;
        card.addEventListener('click', () => showSubjectPage(subject));
        subjectGrid.appendChild(card);
    });
    homePage.classList.remove('hidden');
    subjectPage.classList.add('hidden');
}

function showSubjectPage(subject) {
    homePage.classList.add('hidden');
    subjectPage.classList.remove('hidden');
    subjectTitle.textContent = subject;
    loader.style.display = 'flex';
    tableContainer.classList.add('hidden');
    subjectTable.querySelector('thead').innerHTML = '';
    subjectTable.querySelector('tbody').innerHTML = '';
    listenToSubjectData(subject);
}

function listenToSubjectData(subject) {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
    }
    const subjectDocRef = doc(db, `users/${userId}/gate-prep`, subject);

    unsubscribeSnapshot = onSnapshot(subjectDocRef, (docSnap) => {
        let subjectData = docSnap.exists() ? docSnap.data() : {};
        renderSubjectTable(subject, subjectData);
        loader.style.display = 'none';
        tableContainer.classList.remove('hidden');
    }, (error) => {
        console.error("Error fetching subject data:", error);
        loader.innerText = "Error loading data.";
    });
}

function renderSubjectTable(subject, data) {
    const thead = subjectTable.querySelector('thead');
    const tbody = subjectTable.querySelector('tbody');
    let headerHtml = '<tr><th scope="col" class="sticky-col px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Topic</th>';
    TASK_COLUMNS.forEach(task => {
        headerHtml += `<th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">${task}</th>`;
    });
    headerHtml += '</tr>';
    thead.innerHTML = headerHtml;

    tbody.innerHTML = '';
    const subjectTopics = TOPICS[subject] || [];
    subjectTopics.forEach(topic => {
        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50 dark:hover:bg-gray-700";
        let rowHtml = `<td class="sticky-col px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">${topic}</td>`;
        TASK_COLUMNS.forEach(task => {
            const isChecked = data[topic] && data[topic][task];
            rowHtml += `<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><input type="checkbox" data-subject="${subject}" data-topic="${topic}" data-task="${task}" class="h-5 w-5 rounded-md text-purple-600 bg-gray-200 border-gray-300 focus:ring-purple-500 cursor-pointer" ${isChecked ? 'checked' : ''}></td>`;
        });
        row.innerHTML = rowHtml;
        tbody.appendChild(row);
    });

    tbody.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
}

async function handleCheckboxChange(event) {
    const { subject, topic, task } = event.target.dataset;
    const isChecked = event.target.checked;
    
    // Correctly reference the document path
    const subjectDocRef = doc(db, "users", userId, "gate-prep", subject);

    try {
        // Use dot notation to update a specific field within a nested object
        const fieldToUpdate = `${topic}.${task}`;
        const updateData = { [fieldToUpdate]: isChecked };

        // Use setDoc with { merge: true } to create or update the field
        await setDoc(subjectDocRef, updateData, { merge: true });
        console.log("Firestore updated successfully.");
    } catch (error) {
        console.error("Error updating Firestore:", error);
        event.target.checked = !isChecked;
        alert("Could not save your progress. Please try again.");
    }
}

backButton.addEventListener('click', () => {
    if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
    }
    renderHomePage();
});

// --- START THE APP ---
document.addEventListener('DOMContentLoaded', initializeAppLogic);