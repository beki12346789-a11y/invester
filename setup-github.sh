#!/bin/bash

echo "=========================================="
echo "GitHub Repository Setup Script"
echo "=========================================="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git not initialized. Run 'git init' first."
    exit 1
fi

echo "Choose authentication method:"
echo "1) GitHub Personal Access Token"
echo "2) SSH Key"
echo "3) GitHub CLI (gh)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "Personal Access Token Setup:"
        echo "1. Go to: https://github.com/settings/tokens"
        echo "2. Click 'Generate new token (classic)'"
        echo "3. Select scopes: repo, workflow"
        echo "4. Generate and copy the token"
        echo ""
        read -p "Enter your GitHub username: " username
        read -p "Enter your Personal Access Token: " token
        
        git remote remove origin 2>/dev/null
        git remote add origin https://${token}@github.com/${username}/invester.git
        
        echo ""
        echo "✅ Remote configured with token"
        echo "Now run: git push -u origin main"
        ;;
        
    2)
        echo ""
        echo "SSH Key Setup:"
        
        if [ ! -f ~/.ssh/id_ed25519.pub ]; then
            echo "Generating new SSH key..."
            read -p "Enter your email: " email
            ssh-keygen -t ed25519 -C "$email"
        fi
        
        echo ""
        echo "Your public key:"
        cat ~/.ssh/id_ed25519.pub
        echo ""
        echo "1. Copy the key above"
        echo "2. Go to: https://github.com/settings/keys"
        echo "3. Click 'New SSH key'"
        echo "4. Paste the key and save"
        echo ""
        read -p "Press Enter when done..."
        
        git remote remove origin 2>/dev/null
        git remote add origin git@github.com:beki12346789-a11y/invester.git
        
        echo ""
        echo "✅ Remote configured with SSH"
        echo "Now run: git push -u origin main"
        ;;
        
    3)
        echo ""
        echo "GitHub CLI Setup:"
        echo "1. Install gh: https://cli.github.com/"
        echo "2. Run: gh auth login"
        echo "3. Follow the prompts"
        echo ""
        read -p "Press Enter after installing and authenticating..."
        
        gh repo create invester --public --source=. --remote=origin --push
        
        echo ""
        echo "✅ Repository created and pushed!"
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Verify push: git remote -v"
echo "2. Push code: git push -u origin main"
echo "3. Check GitHub: https://github.com/beki12346789-a11y/invester"
echo ""
