class SpanishGrammarApp {
  constructor() {
    this.exercises = [];
    this.availableExercises = []; // Track unused exercises
    this.currentExercise = null;
    this.isAnswered = false;
    this.init();
  }

  init() {
    this.loadCSV();
    this.setupEventListeners();
  }

  async loadCSV() {
    try {
      // Load the Excel file
      const response = await fetch("content.xlsx");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      // Get the first worksheet
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];

      // Convert to JSON with headers
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Convert to object format (first row as headers)
      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      this.exercises = rows.map((row) => {
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index] || "";
        });

        return {
          word: rowData.Word,
          sentences: [
            {
              prefix: rowData.Sentence1.split("__")[0],
              suffix: rowData.Sentence1.split("__")[1],
              answer: rowData.Add1,
              translation: rowData.Translation1,
            },
            {
              prefix: rowData.Sentence2.split("__")[0],
              suffix: rowData.Sentence2.split("__")[1],
              answer: rowData.Add2,
              translation: rowData.Translation2,
            },
            {
              prefix: rowData.Sentence3.split("__")[0],
              suffix: rowData.Sentence3.split("__")[1],
              answer: rowData.Add3,
              translation: rowData.Translation3,
            },
          ],
          conjugations: {
            present: rowData.Present.split(", "),
            preterite: rowData.Preterite.split(", "),
            future: rowData.Future.split(", "),
          },
        };
      });

      // Initialize available exercises array with all indices
      this.availableExercises = Array.from(
        { length: this.exercises.length },
        (_, i) => i
      );

      this.hideLoading();
      this.showCurrentExercise();
    } catch (error) {
      console.error("Error loading Excel file:", error);
      document.getElementById("loading").innerHTML = `
                <div style="color: #dc3545;">
                    <h3>Error loading exercises</h3>
                    <p>Make sure the <strong>content.xlsx</strong> file is in the same folder as this HTML file.</p>
                    <p>Error details: ${error.message}</p>
                </div>
            `;
    }
  }

  setupEventListeners() {
    document
      .getElementById("check-btn")
      .addEventListener("click", () => this.checkAnswers());
    document
      .getElementById("next-btn")
      .addEventListener("click", () => this.nextExercise());

    // Add Enter key support for inputs
    document.querySelectorAll(".answer-input").forEach((input) => {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !this.isAnswered) {
          this.checkAnswers();
        }
      });
    });
  }

  hideLoading() {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("exercise").classList.remove("hidden");
  }

  getRandomExercise() {
    if (this.availableExercises.length === 0) {
      return null; // No more exercises available
    }

    // Pick a random index from available exercises
    const randomIndex = Math.floor(
      Math.random() * this.availableExercises.length
    );
    const exerciseIndex = this.availableExercises[randomIndex];

    // Remove this exercise from available exercises
    this.availableExercises.splice(randomIndex, 1);

    return exerciseIndex;
  }

  showCurrentExercise() {
    const exerciseIndex = this.getRandomExercise();

    if (exerciseIndex === null) {
      this.showCompleted();
      return;
    }

    this.currentExercise = exerciseIndex;
    const exercise = this.exercises[this.currentExercise];
    this.isAnswered = false;

    // Reset UI
    this.resetUI();

    // Set word and translation
    document.getElementById("infinitive-word").textContent = exercise.word;

    // Set sentences
    exercise.sentences.forEach((sentence, index) => {
      const num = index + 1;
      document.getElementById(`sentence${num}-prefix`).textContent =
        sentence.prefix;
      document.getElementById(`sentence${num}-suffix`).textContent =
        sentence.suffix;
      document.getElementById(`answer${num}`).value = "";
      document.getElementById(`translation${num}`).textContent =
        sentence.translation;
    });

    // Set conjugation table
    this.setConjugationTable(exercise.conjugations);

    // Update progress indicator (optional)
    this.updateProgress();
  }

  updateProgress() {
    const total = this.exercises.length;
    const completed = total - this.availableExercises.length;

    // You can add this to your HTML to show progress
    const progressElement = document.getElementById("progress");
    if (progressElement) {
      progressElement.textContent = `Exercise ${completed} of ${total}`;
    }
  }

  resetUI() {
    // Clear all inputs and reset styling
    document.querySelectorAll(".answer-input").forEach((input) => {
      input.value = "";
      input.classList.remove("correct", "incorrect");
    });

    // Hide feedback elements
    document.querySelectorAll(".translation, .feedback").forEach((el) => {
      el.classList.add("hidden");
    });

    // Reset buttons
    document.getElementById("check-btn").classList.remove("hidden");
    document.getElementById("next-btn").classList.add("hidden");
    document.getElementById("conjugation-table").classList.add("hidden");
  }

  setConjugationTable(conjugations) {
    const pronouns = ["yo", "tu", "el", "nosotros", "ellos"];
    const tenses = ["present", "preterite", "future"];

    pronouns.forEach((pronoun, index) => {
      tenses.forEach((tense) => {
        const elementId = `${tense}-${pronoun}`;
        const element = document.getElementById(elementId);
        if (element && conjugations[tense][index]) {
          element.textContent = conjugations[tense][index];
        }
      });
    });
  }

  checkAnswers() {
    if (this.isAnswered) return;

    const exercise = this.exercises[this.currentExercise];
    let allCorrect = true;

    exercise.sentences.forEach((sentence, index) => {
      const num = index + 1;
      const input = document.getElementById(`answer${num}`);
      const feedback = document.getElementById(`feedback${num}`);
      const translation = document.getElementById(`translation${num}`);

      const userAnswer = input.value.trim().toLowerCase();
      const correctAnswer = sentence.answer.toLowerCase();

      if (userAnswer === correctAnswer) {
        input.classList.add("correct");
        input.classList.remove("incorrect");
        feedback.textContent = "✓ Correct!";
        feedback.classList.add("correct");
        feedback.classList.remove("incorrect");
      } else {
        input.classList.add("incorrect");
        input.classList.remove("correct");
        feedback.textContent = `✗ Correct answer: ${sentence.answer}`;
        feedback.classList.add("incorrect");
        feedback.classList.remove("correct");
        allCorrect = false;
      }

      // Show translation and feedback
      translation.classList.remove("hidden");
      feedback.classList.remove("hidden");
    });

    // Show conjugation table
    document.getElementById("conjugation-table").classList.remove("hidden");

    // Update buttons
    document.getElementById("check-btn").classList.add("hidden");
    document.getElementById("next-btn").classList.remove("hidden");

    this.isAnswered = true;
  }

  nextExercise() {
    this.showCurrentExercise();
  }

  showCompleted() {
    document.getElementById("exercise").innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2>🎉 Congratulations!</h2>
                <p>You've completed all exercises!</p>
                <button onclick="location.reload()" style="margin-top: 20px;">Start Over</button>
            </div>
        `;
  }
}

// Initialize the app when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new SpanishGrammarApp();
});
