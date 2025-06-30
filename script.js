class SpanishGrammarApp {
  constructor() {
    this.exercises = [];
    this.currentExercise = 0;
    this.isAnswered = false;
    this.init();
  }

  init() {
    this.loadCSV();
    this.setupEventListeners();
  }

  async loadCSV() {
    try {
      // In a real implementation, you would load from a CSV file
      // For this demo, we'll use inline data in the CSV format
      const csvData = `Word,Sentence1,Add1,Translation1,Sentence2,Add2,Translation2,Sentence3,Add3,Translation3,Present,Preterite,Future
Comer (To Eat),Yo co__ pan,mo,I eat bread,Tu co__ más comida,mes,You eat more food,Ellas co__ helado,men,They eat icecream,"Como, Comes, Come, Comemos, Comen","Comí, Comiste, Comió, Comimos, Comieron","Comeré, Comerás, Comerá, Comeremos, Comerán"
Hablar (To Speak),Yo ha__ español,blo,I speak Spanish,Tu ha__ inglés,blas,You speak English,Ellos ha__ francés,blan,They speak French,"Hablo, Hablas, Habla, Hablamos, Hablan","Hablé, Hablaste, Habló, Hablamos, Hablaron","Hablaré, Hablarás, Hablará, Hablaremos, Hablarán"
Vivir (To Live),Yo vi__ aquí,vo,I live here,Tu vi__ allí,ves,You live there,Ella vi__ en Madrid,ve,She lives in Madrid,"Vivo, Vives, Vive, Vivimos, Viven","Viví, Viviste, Vivió, Vivimos, Vivieron","Viviré, Vivirás, Vivirá, Viviremos, Vivirán"`;

      const parsed = Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
      });

      this.exercises = parsed.data.map((row) => ({
        word: row.Word,
        sentences: [
          {
            prefix: row.Sentence1.split("__")[0],
            suffix: row.Sentence1.split("__")[1],
            answer: row.Add1,
            translation: row.Translation1,
          },
          {
            prefix: row.Sentence2.split("__")[0],
            suffix: row.Sentence2.split("__")[1],
            answer: row.Add2,
            translation: row.Translation2,
          },
          {
            prefix: row.Sentence3.split("__")[0],
            suffix: row.Sentence3.split("__")[1],
            answer: row.Add3,
            translation: row.Translation3,
          },
        ],
        conjugations: {
          present: row.Present.split(", "),
          preterite: row.Preterite.split(", "),
          future: row.Future.split(", "),
        },
      }));

      this.hideLoading();
      this.showCurrentExercise();
    } catch (error) {
      console.error("Error loading CSV:", error);
      document.getElementById("loading").textContent =
        "Error loading exercises. Please try again.";
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

  showCurrentExercise() {
    if (this.currentExercise >= this.exercises.length) {
      this.showCompleted();
      return;
    }

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
    this.currentExercise++;
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
