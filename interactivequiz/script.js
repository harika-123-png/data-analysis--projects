const quizData = [
    {
        question: "Which language runs in a web browser?",
        options: ["Java", "C", "Python", "JavaScript"],
        answer: "JavaScript"
    },
    {
        question: "What does CSS stand for?",
        options: ["Central Style Sheets", "Cascading Style Sheets", "Computer Style Sheets", "Creative Style System"],
        answer: "Cascading Style Sheets"
    },
    {
        question: "What does HTML stand for?",
        options: ["Hypertext Markup Language", "Hyper Trainer Marking Language", "Hypertext Marketing Language", "Hyper Tool Multi Language"],
        answer: "Hypertext Markup Language"
    },
    {
        question: "Which year was JavaScript launched?",
        options: ["1996", "1995", "1994", "None of the above"],
        answer: "1995"
    },
    {
        question: "Who is the founder of Microsoft?",
        options: ["Steve Jobs", "Bill Gates", "Mark Zuckerberg", "Larry Page"],
        answer: "Bill Gates"
    }
];

const quizForm = document.getElementById('quizForm');
const resultDiv = document.getElementById('result');

function loadQuiz() {
    quizData.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.classList.add('question');

        const questionTitle = document.createElement('h3');
        questionTitle.innerText = `${index + 1}. ${q.question}`;
        questionDiv.appendChild(questionTitle);

        const optionsDiv = document.createElement('div');
        optionsDiv.classList.add('options');

        q.options.forEach(option => {
            const label = document.createElement('label');
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question${index}`;
            input.value = option;
            label.appendChild(input);
            label.appendChild(document.createTextNode(option));
            optionsDiv.appendChild(label);
        });

        questionDiv.appendChild(optionsDiv);
        quizForm.appendChild(questionDiv);
    });
}

document.getElementById('submitBtn').addEventListener('click', () => {
    let score = 0;
    quizData.forEach((q, index) => {
        const selected = document.querySelector(`input[name="question${index}"]:checked`);
        if (selected && selected.value === q.answer) {
            score++;
        }
    });
    resultDiv.innerHTML = `You scored ${score} out of ${quizData.length} questions correctly.`;
});

loadQuiz();
