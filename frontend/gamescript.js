        // Global variables for game and wallet balances
        let totalBalance = 500; // Initial balance for the game
        let winningBalance = 0; // Initial winning balance
        let remainingBalance = 500; // Initial remaining balance (total - winning)

        // Variables for daily limits
        let dailyAddedAmount = 0;
        let lastAddDate = new Date().toDateString();

        let dailyWithdrawAmount = 0;
        let withdrawCountToday = 0;
        let lastWithdrawDate = new Date().toDateString();

        // Game specific variables
        let selectedSide = null;
        let flipping = false;
        let cooldownSeconds = 30;
        let cooldownTimer = null;

        // Function to update the main wallet display at the top-left
        function updateWalletDisplay(extra = '', cssClass = '') {
            const wallet = document.getElementById('wallet');
            wallet.className = 'wallet ' + cssClass;
            remainingBalance = totalBalance - winningBalance; // Ensure remainingBalance is always totalBalance - winningBalance

            wallet.innerHTML = `${extra ? extra + ' → ' : ''}Wallet: ₹${totalBalance}
                <br><small>(Winning: ₹${winningBalance} | Remaining: ₹${remainingBalance})</small>`;

            if (extra) {
                setTimeout(() => {
                    wallet.className = 'wallet';
                    wallet.innerHTML = `Wallet: ₹${totalBalance}
                        <br><small>(Winning: ₹${winningBalance} | Remaining: ₹${remainingBalance})</small>`;
                }, 2000);
            }
            // Crucially, update the offcanvas balances as well
            updateBalanceDisplaysInOffcanvas();
        }

        // Function to update the balances displayed within the offcanvas menu
        function updateBalanceDisplaysInOffcanvas() {
            document.getElementById("walletBalanceAdd").textContent = totalBalance;
            document.getElementById("walletBalanceWithdraw").textContent = totalBalance;
            document.getElementById("winningBalance").textContent = winningBalance;
        }

        // Function to add a transaction to the history table
        function addTransaction(id, type, amount, balance, status, date, time) {
            const tbody = document.getElementById("transactionTableBody");
            const statusColor = { Success: "#00ff99", Pending: "#ff9800", Failed: "#ff6666" }[status] || "#b0bec5"; // Use theme colors

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${id}</td><td>${type}</td><td>₹${amount}</td><td>₹${balance}</td>
                <td><span style="color: ${statusColor};"><strong>${status}</strong></span></td>
                <td><button onclick="toggleDetails(this)">▼</button></td>`;

            const detailRow = document.createElement("tr");
            detailRow.classList.add("detail-row");
            detailRow.style.display = "none"; // Initially hidden
            detailRow.innerHTML = `<td colspan="6"><strong>Date:</strong> ${date} &nbsp; <strong>Time:</strong> ${time}</td>`;

            tbody.prepend(detailRow);
            tbody.prepend(row);
        }

        // Event listener for the "Add Balance" form submission
        document.getElementById("addBalanceForm").addEventListener("submit", function (e) {
            e.preventDefault();
            const today = new Date().toDateString();
            if (today !== lastAddDate) {
                dailyAddedAmount = 0;
                lastAddDate = today;
            }

            const amountInput = document.getElementById("addAmount");
            const fileInput = document.getElementById("screenshotUpload");
            const addBalanceErrorMessage = document.getElementById("addBalanceErrorMessage");
            const addBalanceSuccessMessage = document.getElementById("addBalanceSuccessMessage");
            const balanceAddedOnPagePopup = document.getElementById("balanceAddedOnPagePopup"); // Our new popup element

            addBalanceErrorMessage.style.display = "none"; // Hide previous errors
            addBalanceSuccessMessage.style.display = "none";
            balanceAddedOnPagePopup.classList.remove('hidden'); // Ensure no fade-out class from previous use
            balanceAddedOnPagePopup.style.display = "none"; // Hide our new popup initially

            const amount = parseFloat(amountInput.value);
            const file = fileInput.files[0];

            if (isNaN(amount) || amount <= 0) {
                addBalanceErrorMessage.textContent = "Please enter a valid amount (greater than 0).";
                addBalanceErrorMessage.style.display = "block";
                return;
            }

            if (!file || !file.name.match(/\.(jpg|jpeg)$/i)) {
                addBalanceErrorMessage.textContent = "Please upload a JPG/JPEG screenshot.";
                addBalanceErrorMessage.style.display = "block";
                return;
            }

            if (dailyAddedAmount + amount > 5000) {
                addBalanceErrorMessage.textContent = "You can only add up to ₹5000 per day.";
                addBalanceErrorMessage.style.display = "block";
                return;
            }

            totalBalance += amount;
            remainingBalance += amount; // Assuming added money goes to remaining balance
            dailyAddedAmount += amount;

            updateWalletDisplay(); // Update the main wallet display and offcanvas balances
            this.reset(); // Clear the form fields

            const now = new Date();
            addTransaction("TXN" + Date.now(), "Credit", amount, totalBalance, "Pending", now.toISOString().split("T")[0], now.toLocaleTimeString());

            // Show the success message within the offcanvas
            addBalanceSuccessMessage.textContent = "Balance added successfully! Please wait 10-30 minutes for processing.";
            addBalanceSuccessMessage.style.display = "block";
            
            // Show the on-page popup
            balanceAddedOnPagePopup.style.display = "block"; 

            // Set timeout to hide both messages and the on-page popup
            setTimeout(() => {
                addBalanceSuccessMessage.style.display = "none";
                balanceAddedOnPagePopup.classList.add('hidden'); // Add hidden class for fade-out animation
                setTimeout(() => {
                    balanceAddedOnPagePopup.style.display = "none"; // Completely hide after animation
                }, 500); // Match fadeOut animation duration
            }, 5000); // Hide messages and popup after 5 seconds
        });


        // Event listener for the "Withdraw" form submission
        document.getElementById("withdrawForm").addEventListener("submit", function (e) {
            e.preventDefault();
            const today = new Date().toDateString();
            if (today !== lastWithdrawDate) {
                dailyWithdrawAmount = 0;
                withdrawCountToday = 0;
                lastWithdrawDate = today;
            }

            const withdrawAmountInput = document.getElementById("withdrawAmount");
            const withdrawErrorMessage = document.getElementById("withdrawErrorMessage");
            const withdrawSuccessMessage = document.getElementById("withdrawSuccessMessage");
            const popupMessageWithdraw = document.getElementById("popupMessageWithdraw"); // This was for withdraw, keeping it separate

            withdrawErrorMessage.style.display = "none"; // Hide previous errors
            withdrawSuccessMessage.style.display = "none";
            popupMessageWithdraw.style.display = "none";

            const amount = parseFloat(withdrawAmountInput.value);

            if (isNaN(amount) || amount <= 0) {
                withdrawErrorMessage.textContent = "Please enter a valid withdrawal amount.";
                withdrawErrorMessage.style.display = "block";
                return;
            }

            if (amount < 100) {
                withdrawErrorMessage.textContent = "Minimum withdrawal amount is ₹100.";
                withdrawErrorMessage.style.display = "block";
                return;
            }

            if (amount > winningBalance) {
                withdrawErrorMessage.textContent = "Withdrawal exceeds your winning balance. You can only withdraw from winning balance.";
                withdrawErrorMessage.style.display = "block";
                return;
            }

            if (amount > totalBalance) { // This check is mostly redundant due to winningBalance check but good for safety
                withdrawErrorMessage.textContent = "Withdrawal exceeds your total balance.";
                withdrawErrorMessage.style.display = "block";
                return;
            }

            if (withdrawCountToday >= 3) {
                withdrawErrorMessage.textContent = "Only 3 withdrawals allowed per day.";
                withdrawErrorMessage.style.display = "block";
                return;
            }

            if ((dailyWithdrawAmount + amount) > 5000) {
                withdrawErrorMessage.textContent = "Daily withdrawal limit of ₹5000 exceeded.";
                withdrawErrorMessage.style.display = "block";
                return;
            }

            totalBalance -= amount; // Deduct from total balance
            winningBalance -= amount; // Deduct from winning balance

            // Ensure winningBalance doesn't go negative (already handled by the check above, but good for safety)
            if (winningBalance < 0) {
                winningBalance = 0;
            }

            dailyWithdrawAmount += amount;
            withdrawCountToday++;

            updateWalletDisplay(); // Update the main wallet display and offcanvas balances
            this.reset(); // Clear the form fields

            const now = new Date();
            addTransaction("TXN" + Date.now(), "Debit", amount, totalBalance, "Pending", now.toISOString().split("T")[0], now.toLocaleTimeString());
            
            withdrawSuccessMessage.textContent = "Withdrawal request submitted successfully.";
            withdrawSuccessMessage.style.display = "block";
            popupMessageWithdraw.style.display = "block"; // Show the popup message (for withdraw)

            setTimeout(() => {
                withdrawSuccessMessage.style.display = "none";
                popupMessageWithdraw.style.display = "none"; // Hide the popup message (for withdraw)
            }, 5000);
        });

        // Function to toggle transaction details
        function toggleDetails(button) {
            const row = button.closest("tr");
            const detailRow = row.nextElementSibling;
            const isVisible = detailRow.style.display === "table-row";
            detailRow.style.display = isVisible ? "none" : "table-row";
            button.textContent = isVisible ? "▼" : "▲";
        }

        // Function to search transactions in the history table
        function searchTransactions() {
            const input = document.getElementById("searchInput").value.toLowerCase();
            const rows = document.querySelectorAll("#transactionTableBody tr");
            for (let i = 0; i < rows.length; i += 2) { // Iterate by 2 because each transaction has a main row and a detail row
                const mainRow = rows[i];
                const detailRow = rows[i + 1]; // This assumes a detail row always follows a main row

                if (!mainRow) continue; // Skip if mainRow is null (e.g., at the end of loop)

                const mainRowText = mainRow.textContent.toLowerCase();
                const detailRowText = detailRow ? detailRow.textContent.toLowerCase() : ""; // Handle case where detailRow might not exist

                const match = mainRowText.includes(input) || detailRowText.includes(input);

                mainRow.style.display = match ? "" : "none";
                // If the main row doesn't match, or if it does match but the detail row is for a different transaction,
                // ensure the detail row is hidden and the button is reset.
                if (!match) {
                    if (detailRow) {
                        detailRow.style.display = "none";
                        const button = mainRow.querySelector("button");
                        if (button) button.textContent = "▼"; // Reset button text
                    }
                }
                // If it matches, we only control the main row's visibility. The detail row's visibility
                // is controlled by toggleDetails, so we don't force it open or closed here.
            }
        }


        // Placeholder logout function
        function logout() {
            // In a real application, you'd also send a request to your server to invalidate the session.
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "login.html"; // Redirect to your login page
        }

        // Game functions
        function selectSide(side) {
            selectedSide = side;
            document.getElementById('btnKing').classList.toggle('selected', side === 'KING');
            document.getElementById('btnQueen').classList.toggle('selected', side === 'QUEEN');
        }

        function changeBet(amount) {
            const betInput = document.getElementById('bet');
            let current = parseInt(betInput.value) || 10;
            current += amount;
            // Bet cannot be less than 10 and cannot exceed totalBalance
            current = Math.max(10, Math.min(totalBalance, current));
            betInput.value = current;
        }

        document.getElementById('bet').addEventListener('blur', () => {
            let val = parseInt(document.getElementById('bet').value);
            if (isNaN(val)) { // If user clears the input or enters non-numeric
                val = 10;
            }
            val = Math.max(10, Math.min(totalBalance, val)); // Re-validate on blur
            document.getElementById('bet').value = val;
        });

        function flipCoin() {
            if (flipping || !selectedSide) {
                if (!selectedSide) {
                    alert('Please select a side (KING or QUEEN) to start.');
                }
                return;
            }

            let bet = parseInt(document.getElementById('bet').value);
            if (isNaN(bet) || bet < 10) {
                alert('Please enter a valid bet (minimum ₹10).');
                return;
            }

            if (bet > totalBalance) {
                alert('Your bet exceeds the available balance.');
                return;
            }

            flipping = true;
            document.getElementById('result').style.display = 'none';
            document.getElementById('startButton').disabled = true; // Disable button immediately

            const coin = document.getElementById('coinInner');
            coin.classList.remove('spin');
            coin.style.transform = ''; // Reset transform for consistent animation restart
            void coin.offsetWidth; // Trigger reflow to restart animation
            coin.classList.add('spin');

            const outcome = Math.random() < 0.5 ? 'KING' : 'QUEEN';

            setTimeout(() => {
                coin.classList.remove('spin');
                coin.style.transform = outcome === 'KING' ? 'rotateY(0deg)' : 'rotateY(180deg)';

                const win = selectedSide === outcome;
                document.getElementById('result').textContent = `Result: ${outcome}`;
                document.getElementById('result').style.display = 'block';

                if (win) {
                    totalBalance += bet;
                    winningBalance += bet;
                    updateWalletDisplay(`+₹${bet}`, 'win');
                } else {
                    // This deduction logic is sound, prioritizing remaining then winning
                    let amountToDeduct = bet;

                    if (remainingBalance >= amountToDeduct) {
                        remainingBalance -= amountToDeduct;
                    } else {
                        amountToDeduct -= remainingBalance;
                        remainingBalance = 0;
                        winningBalance -= amountToDeduct;
                        if (winningBalance < 0) {
                            winningBalance = 0;
                        }
                    }
                    totalBalance -= bet; // Total balance always decreases by the full bet amount

                    updateWalletDisplay(`−₹${bet}`, 'lose');
                }

                const li = document.createElement('li');
                li.className = win ? 'win' : 'lose';
                const sideSymbol = selectedSide === 'KING' ? '👑' : '👸';
                const outcomeSymbol = outcome === 'KING' ? '👑' : '👸';
                li.textContent = `You chose ${sideSymbol}, result: ${outcomeSymbol} — ${win ? 'Won' : 'Lost'} (Wallet: ₹${totalBalance})`;
                document.getElementById('historyList').prepend(li);

                startCooldown();
            }, 5000); // Animation duration
        }

        function startCooldown() {
            const cooldownDisplay = document.getElementById('cooldown');
            const startButton = document.getElementById('startButton');
            let remaining = cooldownSeconds;

            startButton.disabled = true;
            cooldownDisplay.textContent = `Next flip in: ${remaining}s`;

            cooldownTimer = setInterval(() => {
                remaining--;
                cooldownDisplay.textContent = `Next flip in: ${remaining}s`;

                if (remaining <= 0) {
                    clearInterval(cooldownTimer);
                    cooldownDisplay.textContent = '';
                    startButton.disabled = false;
                    flipping = false;
                }
            }, 1000);
        }

        // Initial call to set up all wallet displays on page load
        document.addEventListener('DOMContentLoaded', () => {
            updateWalletDisplay();
        });
    