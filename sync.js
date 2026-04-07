#!/usr/bin/env node
/**
 * Auto-sync script - pulls latest from GitHub and clears cache
 * Runs before every npm start
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;

console.log('\n🔄 Syncing with GitHub...');

try {
  // Check for uncommitted changes
  const status = execSync('git status --porcelain', { cwd: projectRoot, encoding: 'utf8' });
  
  if (status.trim()) {
    console.log('📝 Uncommitted changes found. Stashing...');
    try {
      execSync('git stash', { cwd: projectRoot, encoding: 'utf8' });
      console.log('✓ Changes stashed');
    } catch (e) {
      console.log('⚠️  Could not stash changes, continuing...');
    }
  }

  // Pull latest
  console.log('📥 Pulling latest from GitHub...');
  execSync('git pull origin main', { cwd: projectRoot, encoding: 'utf8', stdio: 'inherit' });
  console.log('✓ Latest code pulled');

  // Clear caches
  console.log('🧹 Clearing caches...');
  const dirsToClean = [
    path.join(projectRoot, '.expo'),
    path.join(projectRoot, 'node_modules', '.cache'),
    path.join(projectRoot, '.expo-cache'),
  ];

  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`✓ Cleared: ${path.basename(dir)}`);
    }
  });

  console.log('\n✅ Sync complete! Starting app...\n');
} catch (error) {
  console.error('❌ Sync failed:', error.message);
  console.log('⚠️  Continuing startup anyway...\n');
}
