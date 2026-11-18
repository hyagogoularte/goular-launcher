# Ambiente de desenvolvimento (macOS)

Estado verificado neste Mac: Node 25 e npm 11 ✅ · JDK 25 instalado (novo demais
para o Gradle 8.11) · Android SDK, adb e Gradle ❌ ausentes.

## 1. UI web (já funciona)

```bash
cd web
npm install
npm run dev        # http://localhost:5173 — setas, Enter e Esc simulam o controle
npm test           # testes unitários
npm run build      # gera android/app/src/main/assets/www
```

## 2. Android Studio + SDK

1. Instale o Android Studio: `brew install --cask android-studio` (ou pelo site).
2. Abra uma vez e conclua o assistente (instala SDK em `~/Library/Android/sdk`,
   Platform Tools com `adb`, e o JDK 21 embutido).
3. No *SDK Manager*, garanta **Android SDK Platform 35** e **Build-Tools 35**.
4. Adicione ao `~/.zshrc`:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
```

> Por que o `JAVA_HOME`? O Gradle 8.11 usado aqui não roda no JDK 25 que você tem
> instalado. O JDK 21 do Android Studio resolve. Os scripts em `scripts/` já
> apontam para ele automaticamente quando `JAVA_HOME` não está definido.

## 3. Gradle wrapper (uma vez)

O repositório traz `gradle-wrapper.properties`, mas não o `gradlew` (binário). Gere de
uma destas formas:

- **Android Studio:** *File → Open →* pasta `android/`. Ele sincroniza e passa a
  oferecer *Build → Build APK*. Para ter o `gradlew` no terminal, rode no terminal
  integrado o comando da opção abaixo.
- **Terminal:**

```bash
brew install gradle
```

```bash
cd android && gradle wrapper --gradle-version 8.11.1
```

Depois disso, faça commit de `gradlew`, `gradlew.bat` e `gradle/wrapper/gradle-wrapper.jar`.

## 4. Primeiro build

```bash
cd web && npm run build
```

```bash
cd android && ./gradlew assembleDebug
```

O APK sai em `android/app/build/outputs/apk/debug/app-debug.apk`.
Próximo: [04-firestick.md](04-firestick.md).
