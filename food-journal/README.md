# Food Journal

I decided to build a web based interface for a food journal.

## Overview

A lightweight web application for tracking meals, meal photos,
and nutrition categories.

Users can upload meal entries with a photo, notes, and ratings
for protein, vegetables, carbohydrates, and fats.

The application currently supports multiple users and stores
data in a MySQL database hosted on DreamHost.

## Features

- Multiple users
- Meal photo uploads
- Meal notes
- Protein tracking
- Vegetable tracking
- Carbohydrate tracking
- Fat tracking
- Meal deletion
- Upload progress feedback
- Upload success notifications
- Mobile-friendly upload modal

## Tech Stack

Frontend
- HTML
- CSS
- JavaScript

Backend
- PHP

Database
- MySQL

Hosting
- DreamHost

## Project Structure

food-journal/

├── index.html

├── css/
│   └── food_journal_style.css

├── scripts/
│   └── food-script-main.js

├── api/
│   ├── db.php
│   ├── db-config.example.php
│   ├── users.php
│   └── meals.php

├── media/
│   └── uploads/
│       └── meals/

└── README.md

## Database Setup

Create the database using the provided SQL schema.

Tables:

- users
- meals

The meals table stores:

- user_id
- photo_path
- notes
- protein
- veggies
- carbs
- fats
- created_at

## DB Configuration

Copy:

api/db-config.example.php

to:

api/db-config.php

and replace the placeholder values with real database credentials.

The db-config.php file should never be committed to Git.

The file is ignored via .gitignore.

## Deployment Notes

Current hosting environment:

DreamHost

Uploaded meal images are stored in:

media/uploads/meals/

Uploaded images are automatically deleted when their
associated meal entry is deleted.

## Current Architecture

User Flow

Select User
→ Load Meals
→ Add Meal
→ Upload Photo
→ Save To Database
→ Refresh Meal List

API Endpoints

GET    /api/users.php
GET    /api/meals.php
POST   /api/meals.php
DELETE /api/meals.php

## Future Ideas

- Meal editing
- Daily goals
- Weekly statistics
- Dashboard view
- Meal categories
- Camera-first mobile workflow
- Image compression before upload
- User authentication
- Search and filtering