// All imports MUST be at the very top of the file.
// --- APPLICATION INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                renderHomePage();
                calculateAndDisplayOverallProgress(); // <-- ADD THIS LINE HERE
            } else {
                signInAnonymously(auth).catch(err => console.error("Anonymous sign-in failed:", err));
            }
        });
    } catch (error) {
        console.error("Firebase Initialization Error:", error);
    }
});
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

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
const SUBJECTS = ['NT', 'S & S', 'AEC', 'DE', 'CS', 'EMT', 'EEM', 'EM I & II', 'PS', 'PE', 'MATH', 'GA'];
const TASK_COLUMNS = ['Videos', 'Notes', 'Book Examples', 'DPPs', 'Workbook Exercises', 'PYQs', 'Test Series', 'Bites & Bytes', 'ISRO/ESE PYQs', 'Revision 1', 'Revision 2', 'ME Short Notes'];
const TOPICS = {
    'NT': ['Basics', 'Theorems', 'Transient Analysis', 'Two-Port Networks', 'AC Analysis'], 'S & S': ['Signal Types', 'LTI Systems', 'Fourier Series', 'Fourier Transform', 'Laplace Transform', 'Z-Transform'], 'AEC': ['Diodes', 'BJT', 'FET/MOSFET', 'Op-Amps', 'Oscillators'], 'DE': ['Number Systems', 'Logic Gates', 'Combinational Circuits', 'Sequential Circuits', 'ADC/DAC'], 'CS': ['AM/FM', 'Sampling', 'PCM/DM', 'Digital Modulation', 'Information Theory'], 'EMT': ['Vector Calculus', 'Electrostatics', 'Magnetostatics', 'Maxwell\'s Equations', 'Wave Propagation'], 'EEM': ['Basics of Measurement', 'Bridges and Potentiometers', 'Measuring Instruments', 'CRO', 'Transducers'], 'EM I & II': ['Transformers', 'DC Machines', 'Induction Machines', 'Synchronous Machines'], 'PS': ['Power Generation', 'Transmission & Distribution', 'Fault Analysis', 'Stability', 'Load Flow'], 'PE': ['Power Diodes', 'Thyristors', 'Choppers', 'Inverters', 'Drives'], 'MATH': ['Linear Algebra', 'Calculus', 'Differential Equations', 'Complex Variables', 'Probability'], 'GA': ['Verbal Ability', 'Numerical Ability', 'Logical Reasoning', 'Data Interpretation']
};

// --- FIREBASE INITIALIZATION ---
let app, db, auth, userId, unsubscribeSnapshot = null;

// --- DOM ELEMENTS ---
const homePage = document.getElementById('home-page');
const subjectPage = document.getElementById('subject-page');
const subjectGrid = document.getElementById('subject-grid');
const backButton = document.getElementById('back-button');
const subjectTitle = document.getElementById('subject-title');
const topicCardsContainer = document.getElementById('topic-cards-container');

// --- APPLICATION INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        onAuthStateChanged(auth, user => {
            if (user) {
                userId = user.uid;
                renderHomePage();
            } else {
                signInAnonymously(auth).catch(err => console.error("Anonymous sign-in failed:", err));
            }
        });
    } catch (error) {
        console.error("Firebase Initialization Error:", error);
    }
});

backButton.addEventListener('click', () => {
    if (unsubscribeSnapshot) unsubscribeSnapshot();
    homePage.classList.remove('hidden');
    subjectPage.classList.add('hidden');
});

// --- PAGE RENDERING LOGIC ---

function renderHomePage() {
    subjectGrid.innerHTML = '';
    SUBJECTS.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:bg-purple-50 dark:hover:bg-gray-700';
        card.innerHTML = `<h3 class="text-lg font-bold text-center text-purple-700 dark:text-purple-300">${subject}</h3>`;
        card.addEventListener('click', () => showSubjectPage(subject));
        subjectGrid.appendChild(card);
    });
}

function showSubjectPage(subject) {
    homePage.classList.add('hidden');
    subjectPage.classList.remove('hidden');
    subjectTitle.textContent = subject;

    const subjectDocRef = doc(db, "users", userId, "gate-prep", subject);
    unsubscribeSnapshot = onSnapshot(subjectDocRef, (docSnap) => {
        const subjectData = docSnap.exists() ? docSnap.data() : {};
        renderTopicCards(subject, subjectData);
        updateOverallSubjectProgress(subject, subjectData);
    });
}

function renderTopicCards(subject, subjectData) {
    topicCardsContainer.innerHTML = '';
    const subjectTopics = TOPICS[subject] || [];

    subjectTopics.forEach(topic => {
        const topicData = subjectData[topic] || {};
        let completedTasks = 0;
        const totalTasks = TASK_COLUMNS.length;

        let taskCheckboxesHTML = '<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">';
        TASK_COLUMNS.forEach(task => {
            const isChecked = topicData[task] === true;
            if (isChecked) completedTasks++;

            taskCheckboxesHTML += `
                <label class="flex items-center space-x-2 text-sm cursor-pointer">
                    <input type="checkbox" data-subject="${subject}" data-topic="${topic}" data-task="${task}" 
                           class="h-4 w-4 rounded text-purple-600 bg-gray-200 border-gray-300 focus:ring-purple-500" 
                           ${isChecked ? 'checked' : ''}>
                    <span>${task}</span>
                </label>
            `;
        });
        taskCheckboxesHTML += '</div>';

        const topicProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const isComplete = topicProgress === 100;

        const card = document.createElement('div');
        card.className = `topic-card bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border-2 border-transparent ${isComplete ? 'is-complete' : ''}`;
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-200">${topic}</h4>
                ${isComplete ? '<span class="completion-check">✅</span>' : ''}
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 my-2">
                <div class="bg-blue-600 h-2.5 rounded-full" style="width: ${topicProgress}%"></div>
            </div>
            <p class="text-xs text-right">${completedTasks} / ${totalTasks} tasks complete</p>
            ${taskCheckboxesHTML}
        `;
        topicCardsContainer.appendChild(card);
    });

    topicCardsContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
}

function updateOverallSubjectProgress(subject, subjectData) {
    const subjectTopics = TOPICS[subject] || [];
    if (subjectTopics.length === 0) return;

    let totalCompletedTopics = 0;
    subjectTopics.forEach(topic => {
        const topicData = subjectData[topic] || {};
        const completedTasks = TASK_COLUMNS.filter(task => topicData[task] === true).length;
        if (completedTasks === TASK_COLUMNS.length) {
            totalCompletedTopics++;
        }
    });

    const overallProgress = Math.round((totalCompletedTopics / subjectTopics.length) * 100);
    document.getElementById('subject-progress-bar').style.width = `${overallProgress}%`;
    document.getElementById('subject-progress-text').textContent = `${overallProgress}%`;
}
// Add this new function to script.js

async function calculateAndDisplayOverallProgress() {
    let totalTopicsAcrossAllSubjects = 0;
    let totalCompletedTopicsAcrossAllSubjects = 0;

    for (const subject of SUBJECTS) {
        const subjectTopics = TOPICS[subject] || [];
        totalTopicsAcrossAllSubjects += subjectTopics.length;

        const subjectDocRef = doc(db, "users", userId, "gate-prep", subject);
        const docSnap = await getDoc(subjectDocRef);
        const subjectData = docSnap.exists() ? docSnap.data() : {};
        
        subjectTopics.forEach(topic => {
            const topicData = subjectData[topic] || {};
            const completedTasks = TASK_COLUMNS.filter(task => topicData[task] === true).length;
            if (completedTasks === TASK_COLUMNS.length && TASK_COLUMNS.length > 0) {
                totalCompletedTopicsAcrossAllSubjects++;
            }
        });
    }

    const overallPercentage = totalTopicsAcrossAllSubjects > 0
        ? Math.round((totalCompletedTopicsAcrossAllSubjects / totalTopicsAcrossAllSubjects) * 100)
        : 0;

    document.getElementById('overall-progress-bar').style.width = `${overallPercentage}%`;
    document.getElementById('overall-progress-text').textContent = `${overallPercentage}%`;
}

// --- THE NEW, RELIABLE SAVING LOGIC ---

async function handleCheckboxChange(event) {
    const { subject, topic, task } = event.target.dataset;
    const isChecked = event.target.checked;
    const subjectDocRef = doc(db, "users", userId, "gate-prep", subject);

    try {
        // 1. Get the current data from Firestore
        const docSnap = await getDoc(subjectDocRef);
        const subjectData = docSnap.exists() ? docSnap.data() : {};

        // 2. Modify the data in memory
        if (!subjectData[topic]) {
            subjectData[topic] = {}; // Create topic object if it doesn't exist
        }
        subjectData[topic][task] = isChecked;

        // 3. Write the entire updated subject object back
        await setDoc(subjectDocRef, subjectData);
        console.log("Firestore updated successfully.");

    } catch (error) {
        console.error("Error updating Firestore:", error);
        event.target.checked = !isChecked; // Revert checkbox on error
        alert("Could not save your progress. Please try again.");
    }
}