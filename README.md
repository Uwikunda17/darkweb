# ShadowNet Simulator v4.2.0

ShadowNet is an immersive, educational dark web simulator designed to teach cybersecurity concepts through a gamified interface.

## Features

- **Black Market:** Buy and sell simulated digital goods using atomic transactions.
- **Secure Chat:** PGP-encrypted communication with other operatives.
- **Training Modules:** Interactive scenarios covering phishing, ransomware, and more.
- **Hidden Terminal:** A powerful CLI for advanced operations and secure messaging.

## Hidden Terminal Interface

Access the terminal by pressing `Alt + T` on your keyboard.

### Standard Commands

| Command | Description |
|---------|-------------|
| `HELP` | Display the command menu and available options. |
| `CLEAR` | Clear the terminal screen history. |
| `EXIT` | Close the terminal interface. |
| `STATUS` | View connection status, encryption strength, and your current codename. |

### Secure Chat Commands

| Command | Description |
|---------|-------------|
| `CHAT` | List all active secure channels and operatives you've connected with. |
| `CHAT <CODENAME>` | Open a secure, PGP-encrypted session with the specified operative. |
| `EXIT-CHAT` | Exit the secure chat mode and return to the standard CLI. |

### System Activation Commands

| Command | Description |
|---------|-------------|
| `chat-terminal : activate` | Activate the terminal for system state modifications. |
| `chat-state-true = chat` | Unlock the Chat and Market features (requires activation). |
| `market-state-true = market` | Unlock the Market and Chat features (requires activation). |

## Setup & Configuration

### Firebase Integration

This app uses Firebase for authentication and real-time data. Ensure your `firebase-applet-config.json` is correctly configured.

### Security Rules

The `firestore.rules` file enforces strict schema validation and ownership-based access control. Always redeploy rules after modifying the data model.

## Disclaimer

For educational and entertainment purposes only. No actual illegal activities occur within this application.
