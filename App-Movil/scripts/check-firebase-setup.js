#!/usr/bin/env node

/**
 * Script para verificar la configuración de Firebase
 * Valida que todos los archivos necesarios estén presentes
 */

const fs = require('fs');
const path = require('path');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`\n${BLUE}🔥 Firebase Configuration Checker${RESET}\n`);

let errors = 0;
let warnings = 0;

// Verificar google-services.json (Android)
const googleServicesPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');
if (fs.existsSync(googleServicesPath)) {
  console.log(`${GREEN}✅ google-services.json encontrado${RESET}`);

  // Verificar contenido
  try {
    const content = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    if (content.project_info && content.project_info.project_id) {
      console.log(`   Project ID: ${content.project_info.project_id}`);
    }
  } catch (e) {
    console.log(`${YELLOW}⚠️  Error leyendo google-services.json: ${e.message}${RESET}`);
    warnings++;
  }
} else {
  console.log(`${RED}❌ google-services.json NO encontrado${RESET}`);
  console.log(`   Ubicación esperada: android/app/google-services.json`);
  errors++;
}

// Verificar GoogleService-Info.plist (iOS)
const googleServicePlistPath = path.join(__dirname, '..', 'ios', 'GoogleService-Info.plist');
if (fs.existsSync(googleServicePlistPath)) {
  console.log(`${GREEN}✅ GoogleService-Info.plist encontrado (iOS)${RESET}`);
} else {
  console.log(`${YELLOW}⚠️  GoogleService-Info.plist NO encontrado (iOS)${RESET}`);
  console.log(`   Ubicación esperada: ios/GoogleService-Info.plist`);
  console.log(`   (Puedes ignorar esto si solo desarrollas para Android)`);
  warnings++;
}

// Verificar android/app/build.gradle
const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (fs.existsSync(buildGradlePath)) {
  const content = fs.readFileSync(buildGradlePath, 'utf8');

  const checks = [
    { plugin: 'com.google.gms.google-services', name: 'Google Services' },
    { plugin: 'com.google.firebase.crashlytics', name: 'Crashlytics' },
    { plugin: 'com.google.firebase.firebase-perf', name: 'Performance' },
  ];

  console.log(`\n${BLUE}Verificando plugins en build.gradle:${RESET}`);

  checks.forEach(({ plugin, name }) => {
    if (content.includes(`apply plugin: '${plugin}'`)) {
      console.log(`${GREEN}✅ ${name} plugin configurado${RESET}`);
    } else {
      console.log(`${RED}❌ ${name} plugin NO configurado${RESET}`);
      console.log(`   Agrega: apply plugin: '${plugin}'`);
      errors++;
    }
  });
}

// Verificar package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  console.log(`\n${BLUE}Verificando dependencias:${RESET}`);

  const requiredDeps = [
    '@react-native-firebase/app',
    '@react-native-firebase/perf',
    '@react-native-firebase/crashlytics',
  ];

  requiredDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`${GREEN}✅ ${dep} instalado (${deps[dep]})${RESET}`);
    } else {
      console.log(`${RED}❌ ${dep} NO instalado${RESET}`);
      console.log(`   Ejecuta: npm install ${dep}`);
      errors++;
    }
  });
}

// Verificar archivos de servicios
console.log(`\n${BLUE}Verificando servicios:${RESET}`);

const services = [
  { path: 'lib/performanceService.ts', name: 'PerformanceService' },
  { path: 'lib/crashlyticsService.ts', name: 'CrashlyticsService' },
  { path: 'lib/firebaseNative.ts', name: 'Firebase Native Init' },
];

services.forEach(({ path: servicePath, name }) => {
  const fullPath = path.join(__dirname, '..', servicePath);
  if (fs.existsSync(fullPath)) {
    console.log(`${GREEN}✅ ${name} encontrado${RESET}`);
  } else {
    console.log(`${YELLOW}⚠️  ${name} NO encontrado${RESET}`);
    console.log(`   Ubicación esperada: ${servicePath}`);
    warnings++;
  }
});

// Verificar variables de entorno
console.log(`\n${BLUE}Verificando variables de entorno:${RESET}`);

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log(`${GREEN}✅ Archivo .env encontrado${RESET}`);

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];

  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`${GREEN}   ✓ ${varName}${RESET}`);
    } else {
      console.log(`${YELLOW}   ⚠ ${varName} no definida${RESET}`);
      warnings++;
    }
  });
} else {
  console.log(`${YELLOW}⚠️  Archivo .env NO encontrado${RESET}`);
  warnings++;
}

// Resumen final
console.log(`\n${BLUE}${'='.repeat(60)}${RESET}`);
if (errors === 0 && warnings === 0) {
  console.log(`${GREEN}✅ ¡Configuración de Firebase completa!${RESET}`);
  console.log(`\n${BLUE}Próximos pasos:${RESET}`);
  console.log(`1. Compila la app: ${YELLOW}npx expo run:android${RESET}`);
  console.log(`2. Usa la app para generar datos`);
  console.log(`3. Verifica en Firebase Console (puede tardar 12-24h)`);
} else {
  if (errors > 0) {
    console.log(`${RED}❌ ${errors} error(es) encontrado(s)${RESET}`);
  }
  if (warnings > 0) {
    console.log(`${YELLOW}⚠️  ${warnings} advertencia(s)${RESET}`);
  }
  console.log(`\n${BLUE}Consulta la guía completa:${RESET} FIREBASE_SETUP.md`);
}
console.log(`${BLUE}${'='.repeat(60)}${RESET}\n`);

process.exit(errors > 0 ? 1 : 0);
