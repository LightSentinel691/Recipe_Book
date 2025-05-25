// State management
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let allRecipes = [];
let callingContainer;

// DOM Elements
const pages = {
    home: document.getElementById('home-page'),
    recipe: document.getElementById('recipe-page'),
    myRecipes: document.getElementById('my-recipes-page'),
    auth: document.getElementById('auth-page')
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
    loadPopularRecipes();
});

// Page navigation
function showPage(pageId) {
    Object.values(pages).forEach(page => {
        page.classList.remove('active-page');
    });
    pages[pageId].classList.add('active-page');
}

// Authentication functions
function checkAuthStatus() {
    const loginBtn = document.getElementById('login-btn');
    const userGreeting = document.getElementById('user-greeting');
            
    if (currentUser) {
        loginBtn.classList.add('hidden');
        userGreeting.classList.remove('hidden');
        document.getElementById('username').textContent = currentUser.name;
    } else {
        loginBtn.classList.remove('hidden');
        userGreeting.classList.add('hidden');
    }
}

function setupEventListeners() {
    // Search functionality
    document.getElementById('search-btn').addEventListener('click', searchRecipes);
    document.getElementById('search-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchRecipes();
    });

    // Auth tabs
    document.getElementById('login-tab').addEventListener('click', () => switchAuthTab('login'));
    document.getElementById('register-tab').addEventListener('click', () => switchAuthTab('register'));

    // Auth forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Navigation buttons
    document.getElementById('login-btn').addEventListener('click', () => showPage('auth'));
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        loginTab.classList.add('border-red-500', 'text-black');
        loginTab.classList.remove('text-gray-500');
        registerTab.classList.add('text-gray-500');
        registerTab.classList.remove('border-red-500', 'text-black');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        registerTab.classList.add('border-red-500', 'text-black');
        registerTab.classList.remove('text-gray-500');
        loginTab.classList.add('text-gray-500');
        loginTab.classList.remove('border-red-500', 'text-black');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // In a real app, this would be an API call
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showPage('home');
        checkAuthStatus();
        showAuthMessage('Login successful!', 'success');
    } else {
        howAuthMessage('Invalid email or password', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    if (password !== confirmPassword) {
        showAuthMessage('Passwords do not match', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.some(u => u.email === email)) {
        showAuthMessage('Email already registered', 'error');
        return;
    }

    const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, // Note: In production, hash the password
        savedRecipes: []
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
    showPage('home');
    checkAuthStatus();
    showAuthMessage('Registration successful!', 'success');
}

function showAuthMessage(message, type) {
    const authMessage = document.getElementById('auth-message');
    authMessage.textContent = message;
    authMessage.className = `mt-4 p-3 rounded ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    authMessage.classList.remove('hidden');
            
    setTimeout(() => {
        authMessage.classList.add('hidden');
    }, 3000);
}

function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    checkAuthStatus();
    showPage('home');
}

// Recipe functions
async function loadPopularRecipes() {
    try {
        // Fetch 4 random recipes
        const recipePromises = Array(4).fill().map(() => 
            fetch('https://www.themealdb.com/api/json/v1/1/random.php')
                .then(res => res.json())
                .then(data => data.meals[0])
            );
                
        const recipes = await Promise.all(recipePromises);
        allRecipes = [...recipes];
        displayRecipes(recipes, document.getElementById('recipe-grid'));
    } catch (error) {
        console.error('Error loading recipes:', error);
    }
}

async function searchRecipes() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
        const data = await response.json();
                
        if (data.meals) {
            allRecipes = [...data.meals];
            displayRecipes(data.meals, document.getElementById('recipe-grid'));
        } else {
            document.getElementById('recipe-grid').innerHTML = '<p class="col-span-full text-center py-8">No recipes found</p>';
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}

function displayRecipes(recipes, container) {
    container.innerHTML = '';
    callingContainer = container.id;
    recipes.forEach(recipe => {
        const recipeCard = document.createElement('div');
        recipeCard.className = 'recipe-card bg-white rounded-lg shadow-md overflow-hidden transition';
        recipeCard.innerHTML = `
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="font-bold text-lg mb-2">${recipe.strMeal}</h3>
                <button onclick="showRecipeDetail('${recipe.idMeal}')" 
                        class="text-red-600 hover:underline">
                    View Recipe
                </button>
            </div>
        `;
        container.appendChild(recipeCard);
    });
}

function showRecipeDetail(recipeId, container) {
    console.log("running here");
    const recipe = allRecipes.find(r => r.idMeal === recipeId);
        
    console.log(recipe);
    if (!recipe) return;

    document.getElementById('recipe-title').textContent = recipe.strMeal;
    document.getElementById('recipe-image').src = recipe.strMealThumb;
    document.getElementById('recipe-image').alt = recipe.strMeal;
    document.getElementById('recipe-category').textContent = recipe.strCategory || 'Unknown';
    document.getElementById('recipe-area').textContent = recipe.strArea || 'Unknown';

    // Display ingredients
    const ingredientsList = document.getElementById('ingredients-list');
    ingredientsList.innerHTML = '';
    for (let i = 1; i <= 20; i++) {
        const ingredient = recipe[`strIngredient${i}`];
        const measure = recipe[`strMeasure${i}`];
        if (ingredient && ingredient.trim()) {
            const li = document.createElement('li');
            li.className = 'flex items-start';
            li.innerHTML = `
                <svg class="w-5 h-5 text-red-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>${measure} ${ingredient}</span>
            `;
            ingredientsList.appendChild(li);
        }
    }

    // Display instructions
    const instructionsList = document.getElementById('instructions-list');
    instructionsList.innerHTML = '';
    const instructions = recipe.strInstructions.split('\r\n').filter(step => step.trim());
    instructions.forEach((step, index) => {
        const li = document.createElement('li');
        li.className = 'flex';
        li.innerHTML = `
            <span class="font-bold mr-2">${index + 1}.</span>
            <span>${step}</span>
        `;
        instructionsList.appendChild(li);
    });

    // Setup save button
    const saveBtn = document.getElementById('save-recipe-btn');
    if (currentUser && currentUser.savedRecipes.includes(recipeId)) {
        saveBtn.textContent = 'Saved';
        saveBtn.classList.add('bg-green-500', 'hover:bg-green-600');
        saveBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        saveBtn.onclick = null;
    } else {
        saveBtn.textContent = 'Save Recipe';
        saveBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        saveBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        saveBtn.onclick = () => saveRecipe(recipeId);
    }

    showPage('recipe');
}

function saveRecipe(recipeId) {
    if (!currentUser) {
        showPage('auth');
        return;
    }
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);
            
            
    if (userIndex !== -1 && !users[userIndex].savedRecipes.includes(recipeId)) {
        users[userIndex].savedRecipes.push(recipeId);
        localStorage.setItem('users', JSON.stringify(users));
        currentUser.savedRecipes = users[userIndex].savedRecipes;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
        const saveBtn = document.getElementById('save-recipe-btn');
        saveBtn.textContent = 'Saved';
        saveBtn.classList.add('bg-green-500', 'hover:bg-green-600');
        saveBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
        saveBtn.onclick = null;
    }
}

async function loadSavedRecipes() {
    if (!currentUser) {
        showPage('auth');
        return;
    }

    const container = document.getElementById('saved-recipes-grid');
    container.innerHTML = '';

    if (currentUser.savedRecipes.length === 0) {
        container.innerHTML = '<p class="col-span-full text-center py-8">No saved recipes yet</p>';
        return;
    }

    const userObj = localStorage.getItem('currentUser');
    const parsedObj = JSON.parse(userObj);
    const savedRecipes = parsedObj['savedRecipes'];

            
    if (savedRecipes.length > 0) {
        //we create an array to save all the meal details
        const savedMealDetails = [];
        //we get each value from savedRecipes and call async function fo it
        for (const id of savedRecipes) {
            let recipeObj = await searchSavedRecipes(id);
            savedMealDetails.push(recipeObj);
        }
        allRecipes = savedMealDetails;
        //display the gotten object
        displayRecipes(savedMealDetails, document.getElementById("saved-recipes-grid"))
    } else {
        container.innerHTML = '<p class="col-span-full text-center py-8">Saved recipes not found in current session</p>';
    }
}


async function searchSavedRecipes(recipeId) {
    try {
        const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${recipeId}`);
        const data = await response.json();
                
        if (data.meals) {
            return data.meals[0];
        }
    } catch (error) {
        console.error('Displaying Saved Meals:', error);
    }
}

function redirectUserToProperPage(container) {
    // Find the closest section containing the clicked button
        if (container == "recipe-grid") {
            showPage('home');
        } else {
            showPage('myRecipes'); 
            displayRecipes(allRecipes, document.getElementById("saved-recipes-grid"))
        }
        // showPage('home')
            
            
            
        }


        // Make functions available globally
        window.showPage = showPage;
        window.showRecipeDetail = showRecipeDetail;
        window.saveRecipe = saveRecipe;
        window.logout = logout;