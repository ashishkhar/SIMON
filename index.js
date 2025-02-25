// Initialize variables
let gamePattern = [];
let userClickedPattern = [];
let level = 0;
let started = false;
let score = 0; // Track score
let speed = 1000; // Initial speed for sequence display
let streak = 0; // Track consecutive correct sequences
let multiplier = 1; // Score multiplier for streaks
let sequenceStartTime; // Track the start time of the sequence
let highScore = localStorage.getItem('simonHighScore') || 0; // Get stored high score from localStorage or default to 0

// Add encouraging messages for different achievements
const achievements = {
    levelUp: ["Brilliant!", "Amazing!", "Incredible Memory!", "You're a Natural!", "Unstoppable!"],
    streak: ["Perfect Streak!", "On Fire!", "Unstoppable!", "Memory Master!"],
    highScore: ["New High Score!", "You're Breaking Records!", "Legendary Performance!"]
};

// Add CSS for continue prompt
$("<style>")
    .text(`
        .continue-prompt {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 1000;
        }
        .continue-prompt button {
            margin: 10px;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
        }
        .penalty-warning {
            color: #ff4444;
            font-weight: bold;
            margin: 10px 0;
        }
        .btn.round {
            border-radius: 50%; /* Change to circular buttons */
        }
        .btn.square {
            border-radius: 0; /* Change to square buttons */
        }
        .btn.triangle {
            width: 0;
            height: 0;
            border-left: 50px solid transparent;
            border-right: 50px solid transparent;
            border-bottom: 100px solid red; /* Change color as needed */
            background: transparent;
        }
        .btn.pentagon {
            width: 0;
            height: 0;
            border-left: 50px solid transparent;
            border-right: 50px solid transparent;
            border-bottom: 100px solid blue; /* Change color as needed */
            clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
        }
        .btn.hexagon {
            width: 100px;
            height: 57.74px;
            background-color: green; /* Change color as needed */
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .pro-message {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            text-align: center;
            z-index: 1000;
            animation: fadeInOut 2.5s ease-in-out forwards;
        }
        
        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
    `)
    .appendTo("head");

// Start the game on button click
$("#start-button").click(function() {
    // Always reset the game state when the start button is clicked
    startOver(); // Reset game state
    $("#level-title").text("Level " + level + " | Score: " + score);
    nextSequence(); // Start the game
});

// Generate the next sequence
function nextSequence() {
    userClickedPattern = [];
    level++;
    
    // Change button shapes based on level
    $(".btn").each(function(index) {
        $(this).removeClass("round square triangle pentagon hexagon").addClass(getShapeForLevel(level, index)); // Change to unique shapes
    });

    // Show level-up animation for milestone levels
    if (level % 5 === 0) {
        $("#level-title").addClass("level-milestone");
        setTimeout(() => $("#level-title").removeClass("level-milestone"), 1000);
    }
    
    $("#level-title").text(`Level ${level} | Score: ${score}`);
    
    const randomNumber = Math.floor(Math.random() * 4);
    const buttonColors = ["green", "red", "yellow", "blue"];
    const randomChosenColor = buttonColors[randomNumber];
    gamePattern.push(randomChosenColor);
    
    // Start timing the sequence
    sequenceStartTime = Date.now();
    
    // Play the sequence with increasing speed
    playSequence();
}

// Function to get shape for each button based on level and index
function getShapeForLevel(level, index) {
    if (level <= 3) {
        return "square"; // All square buttons for levels 1-3
    } else if (level === 4) {
        return "round"; // All round buttons for level 4
    } else if (level === 5) {
        return index === 0 ? "triangle" : "square"; // Triangle for first button, square for others
    } else if (level === 6) {
        return index === 1 ? "pentagon" : "round"; // Pentagon for second button, round for others
    } else {
        return "hexagon"; // Hexagon for all buttons after level 6
    }
}

// Play the sequence with increasing speed
function playSequence() {
    let i = 0;
    const interval = setInterval(function() {
        const currentColor = gamePattern[i];
        $("#" + currentColor).addClass("active"); // Add active class for glow effect
        $("#" + currentColor).fadeIn(100).fadeOut(100).fadeIn(100);
        playSound(currentColor);
        setTimeout(function() {
            $("#" + currentColor).removeClass("active"); // Remove active class after animation
        }, 300);
        i++;
        if (i >= gamePattern.length) {
            clearInterval(interval);
            speed = Math.max(200, speed - 100); // Increase speed, but not below 200ms
        }
    }, speed);
}

// Handle button clicks
$(".btn").click(function() {
    const userChosenColor = $(this).attr("id");
    userClickedPattern.push(userChosenColor);
    playSound(userChosenColor);
    animatePress(userChosenColor);
    checkAnswer(userClickedPattern.length - 1);
});

// Play sound for the button
function playSound(name) {
    const audio = new Audio("sounds/" + name + ".mp3");
    audio.play();
}

// Animate button press
function animatePress(currentColor) {
    $("#" + currentColor).addClass("pressed");
    setTimeout(function() {
        $("#" + currentColor).removeClass("pressed");
    }, 100);
}

// Check the user's answer with multiplier system
function checkAnswer(currentLevel) {
    if (gamePattern[currentLevel] === userClickedPattern[currentLevel]) {
        if (userClickedPattern.length === gamePattern.length) {
            streak++;
            multiplier = Math.min(4, 1 + Math.floor(streak / 3));
            
            let points = 10 * multiplier;
            score += points;
            
            // Update high score
            updateHighScore();
            
            // Show achievement message
            showAchievement(points);
            
            // Check if it's level 4 and sequence was completed quickly
            const timeTaken = Date.now() - sequenceStartTime; // Time in milliseconds
            if (level === 4 && timeTaken < 4500) { // If completed in less than 5.5 seconds
                speed = Math.max(200, speed - 200); // Increase speed more dramatically
                showTemporaryMessage("You look like a pro already! Let me fix that for you. 😈");
                
                // Wait for the message to fade before starting the next sequence
                setTimeout(function() {
                    nextSequence();
                }, 2500); // Wait for the message duration
            } else {
                setTimeout(function() {
                    nextSequence();
                }, 1000); // Normal wait time for other levels
            }
        }
    } else {
        playSound("wrong");
        const penaltyAmount = Math.max(20, Math.floor(score * 0.4)); // 40% penalty or minimum 20 points
        score = Math.max(0, score - penaltyAmount); // Apply penalty but don't go below 0
        $("#score-title").text(`Score: ${score} | High Score: ${highScore}`);
        
        if (score > 0) {
            showContinuePrompt();
        } else {
            gameOver();
        }
    }
}

// Show continue prompt
function showContinuePrompt() {
    const penaltyAmount = Math.max(20, Math.floor(score * 0.4)); // 40% penalty or minimum 20 points
    
    const prompt = $("<div>")
        .addClass("continue-prompt")
        .html(`
            <h2>Game Over!</h2>
            <p>Current Score: ${score}</p>
            <p class="penalty-warning">Continue with a ${penaltyAmount} point penalty?</p>
            <button id="continue-yes">Yes (-${penaltyAmount} points)</button>
            <button id="continue-no">No (End Game)</button>
        `)
        .appendTo("body");

    $("#continue-yes").click(function() {
        score = Math.max(0, score - penaltyAmount); // Apply penalty but don't go below 0
        $("#score-title").text("Score: " + score);
        prompt.remove();
        continueGame();
    });

    $("#continue-no").click(function() {
        prompt.remove();
        gameOver();
    });
}

// Continue the game after using life
function continueGame() {
    $("body").removeClass("game-over");
    $("#level-title").text(`Level ${level} | Score: ${score}`);
    userClickedPattern = [];
    
    // Add a brief pause before continuing
    setTimeout(function() {
        playSequence(); // Replay the current sequence
    }, 1000); // 1000 milliseconds = 1 second
}

// Game over
function gameOver() {
    $("#level-title").html(`Game Over! Final Score: ${score}<br>High Score: ${highScore}<br>Press Start to Play Again`);
    $("body").addClass("game-over");
    setTimeout(function() {
        $("body").removeClass("game-over");
    }, 200);
    startOver();
}

// Show achievement message with animation
function showAchievement(points) {
    let message = "";
    
    // Select appropriate message based on performance
    if (streak >= 5) {
        message = achievements.streak[Math.floor(Math.random() * achievements.streak.length)];
    } else if (level % 5 === 0) {
        message = achievements.levelUp[Math.floor(Math.random() * achievements.levelUp.length)];
    }
    
    // Create and animate achievement popup
    if (message) {
        const popup = $("<div>")
            .addClass("achievement-popup")
            .html(`${message}<br>+${points} points!`)
            .appendTo("body");
        
        setTimeout(() => popup.remove(), 2000);
    }
}

// Add CSS for achievement popup
$("<style>")
    .text(`
        .achievement-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 215, 0, 0.9);
            color: #000;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            font-size: 24px;
            animation: popupAnimation 2s ease-out;
            z-index: 1000;
        }
        
        @keyframes popupAnimation {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
            30% { transform: translate(-50%, -50%) scale(1); }
            70% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
        }
        
        .game-over {
            background-color: red;
            opacity: 0.8;
            transition: background-color 0.2s;
        }
    `)
    .appendTo("head");

// Restart the game
function startOver() {
    level = 0;
    gamePattern = [];
    userClickedPattern = [];
    started = false;
    score = 0;
    speed = 1000; // Reset speed
    $("#score-title").text(`Score: 0 | High Score: ${highScore}`);
    $("#level-title").text("Press Start to Begin");
}

// Add this new function to show temporary messages
function showTemporaryMessage(message, duration = 2500) {
    const messageElement = $("<div>")
        .addClass("pro-message")
        .text(message)
        .appendTo("body");
    
    setTimeout(() => {
        messageElement.remove();
    }, duration);
}

// Add this function to update high score
function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('simonHighScore', highScore); // Store high score in localStorage
        showTemporaryMessage("New High Score! 🏆");
    }
    // Update the display to show both current and high score
    $("#score-title").text(`Score: ${score} | High Score: ${highScore}`);
}

// Add this to show the high score when the game loads
$(document).ready(function() {
    $("#score-title").text(`Score: 0 | High Score: ${highScore}`);
});

// Add this function to reset high score
function resetHighScore() {
    highScore = 0;
    localStorage.removeItem('simonHighScore'); // Remove high score from localStorage
    $("#score-title").text(`Score: ${score} | High Score: ${highScore}`);
    showTemporaryMessage("High Score Reset!");
}

// Add click handler for reset button
$("#reset-highscore").click(function() {
    resetHighScore();
});


