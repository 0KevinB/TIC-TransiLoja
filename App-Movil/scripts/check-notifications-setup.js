#!/usr/bin/env node

/**
 * Script para verificar que la configuración de notificaciones push esté correcta
 * Uso: node scripts/check-notifications-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración de notificaciones push...\n');

const rootDir = path.join(__dirname, '..');
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');
const configPath = path.join(rootDir, 'app.config.js');

let hasErrors = false;
let hasWarnings = false;

// 1. Verificar que existe .env
console.log('1️⃣ Verificando archivo .env...');
if (!fs.existsSync(envPath)) {
  console.error('   ❌ ERROR: No existe el archivo .env');
  console.error('   → Copia .env.example a .env: cp .env.example .env');
  hasErrors = true;
} else {
  console.log('   ✅ Archivo .env existe');

  // Leer contenido del .env
  const envContent = fs.readFileSync(envPath, 'utf8');

  // 2. Verificar EXPO_PUBLIC_PROJECT_ID
  console.log('\n2️⃣ Verificando EXPO_PUBLIC_PROJECT_ID...');
  const projectIdMatch = envContent.match(/EXPO_PUBLIC_PROJECT_ID=(.+)/);

  if (!projectIdMatch) {
    console.error('   ❌ ERROR: EXPO_PUBLIC_PROJECT_ID no está definido en .env');
    console.error('   → Agrega: EXPO_PUBLIC_PROJECT_ID=cea6d837-92cb-4ffb-83d6-76c84ae6be1c');
    hasErrors = true;
  } else {
    const projectId = projectIdMatch[1].trim();
    if (!projectId || projectId === 'your_project_id_here') {
      console.error('   ❌ ERROR: EXPO_PUBLIC_PROJECT_ID tiene un valor inválido');
      console.error('   → Valor actual:', projectId);
      console.error('   → Debe ser: cea6d837-92cb-4ffb-83d6-76c84ae6be1c');
      hasErrors = true;
    } else if (projectId !== 'cea6d837-92cb-4ffb-83d6-76c84ae6be1c') {
      console.warn('   ⚠️  ADVERTENCIA: El Project ID no coincide con el esperado');
      console.warn('   → Valor actual:', projectId);
      console.warn('   → Valor esperado: cea6d837-92cb-4ffb-83d6-76c84ae6be1c');
      hasWarnings = true;
    } else {
      console.log('   ✅ EXPO_PUBLIC_PROJECT_ID configurado correctamente');
      console.log('   → Valor:', projectId);
    }
  }

  // 3. Verificar variables de Firebase
  console.log('\n3️⃣ Verificando variables de Firebase...');
  const firebaseVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ];

  let missingVars = [];
  let invalidVars = [];

  firebaseVars.forEach((varName) => {
    const regex = new RegExp(`${varName}=(.+)`);
    const match = envContent.match(regex);

    if (!match) {
      missingVars.push(varName);
    } else {
      const value = match[1].trim();
      if (
        !value ||
        value.includes('your_') ||
        value.includes('here')
      ) {
        invalidVars.push({ name: varName, value });
      }
    }
  });

  if (missingVars.length > 0) {
    console.error('   ❌ ERROR: Variables de Firebase faltantes:');
    missingVars.forEach((v) => console.error('      -', v));
    hasErrors = true;
  } else if (invalidVars.length > 0) {
    console.warn('   ⚠️  ADVERTENCIA: Variables con valores de ejemplo:');
    invalidVars.forEach((v) => console.warn(`      - ${v.name} = ${v.value}`));
    hasWarnings = true;
  } else {
    console.log('   ✅ Todas las variables de Firebase están configuradas');
  }
}

// 4. Verificar app.config.js
console.log('\n4️⃣ Verificando app.config.js...');
if (!fs.existsSync(configPath)) {
  console.error('   ❌ ERROR: No existe app.config.js');
  hasErrors = true;
} else {
  const configContent = fs.readFileSync(configPath, 'utf8');

  // Verificar que tenga el plugin de notificaciones
  if (!configContent.includes('expo-notifications')) {
    console.error('   ❌ ERROR: Plugin expo-notifications no está en la configuración');
    hasErrors = true;
  } else {
    console.log('   ✅ Plugin expo-notifications configurado');
  }

  // Verificar que tenga la configuración de notificaciones
  if (!configContent.includes('notification:')) {
    console.warn('   ⚠️  ADVERTENCIA: No se encuentra la configuración de notificaciones');
    hasWarnings = true;
  } else {
    console.log('   ✅ Configuración de notificaciones presente');
  }

  // Verificar Project ID en extra.eas
  if (!configContent.includes('projectId:')) {
    console.error('   ❌ ERROR: No se encuentra projectId en extra.eas');
    hasErrors = true;
  } else {
    console.log('   ✅ Project ID en extra.eas configurado');
  }
}

// 5. Verificar package.json
console.log('\n5️⃣ Verificando dependencias...');
const packageJsonPath = path.join(rootDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('   ❌ ERROR: No existe package.json');
  hasErrors = true;
} else {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredDeps = [
    'expo-notifications',
    'expo-device',
  ];

  const missingDeps = requiredDeps.filter((dep) => !dependencies[dep]);

  if (missingDeps.length > 0) {
    console.error('   ❌ ERROR: Dependencias faltantes:');
    missingDeps.forEach((dep) => console.error('      -', dep));
    console.error('   → Instala con: npx expo install', missingDeps.join(' '));
    hasErrors = true;
  } else {
    console.log('   ✅ Todas las dependencias necesarias están instaladas');
    console.log('   → expo-notifications:', dependencies['expo-notifications']);
    console.log('   → expo-device:', dependencies['expo-device']);
  }
}

// Resumen
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.error('❌ CONFIGURACIÓN INCORRECTA - Hay errores que deben corregirse');
  console.error('\n📖 Consulta NOTIFICACIONES-SETUP.md para más información');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  CONFIGURACIÓN PARCIAL - Hay advertencias a revisar');
  console.warn('\n📖 Consulta NOTIFICACIONES-SETUP.md para más información');
  process.exit(0);
} else {
  console.log('✅ CONFIGURACIÓN CORRECTA - Todo listo para notificaciones push!');
  console.log('\n📱 Ahora puedes:');
  console.log('   1. Ejecutar la app: npx expo start');
  console.log('   2. Crear una alerta desde el admin web');
  console.log('   3. Verificar que llegue la notificación');
  console.log('\n📖 Consulta NOTIFICACIONES-SETUP.md para troubleshooting');
  process.exit(0);
}
