# 🚀 Live Deployment Setup Guide

## **Overview**
This system automatically deploys status updates to Zebediah's live status page whenever you press a button in your management dashboard.

## **How It Works**
1. **You click a button** in your management dashboard
2. **API triggers** GitHub Actions workflow
3. **GitHub Actions** updates files and commits changes
4. **Vercel automatically deploys** the updated status page
5. **Zebediah sees changes** in a few minutes

---

## **🔧 Setup Steps**

### **Step 1: Create GitHub Personal Access Token**
1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "INEX Status Updates"
4. Select these scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Copy the token (you won't see it again!)

### **Step 2: Add GitHub Token to Vercel**
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your INEX project
3. Go to Settings > Environment Variables
4. Add new variable:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Your GitHub token from Step 1
   - **Environment**: Production, Preview, Development
5. Click Save

### **Step 3: Get Vercel Deploy Hook (Optional)**
1. In Vercel Dashboard, go to Settings > Git
2. Scroll down to "Deploy Hooks"
3. Click "Create Hook"
4. Name it "Status Updates"
5. Copy the webhook URL

### **Step 4: Update Environment Variables**
1. Copy `env.example` to `.env.local`
2. Update the values:
   ```bash
   GITHUB_TOKEN=ghp_your_actual_token_here
   VERCEL_DEPLOY_HOOK=https://vercel.com/your-deploy-hook-url
   ```

---

## **🎯 Usage**

### **Live Status Updates**
1. **Update your status** using the management dashboard
2. **Click "🚀 Deploy Live Update"**
3. **Wait 2-3 minutes** for deployment
4. **Zebediah sees changes** automatically

### **Phase Changes**
1. **Change phase** using "Next Phase" button
2. **Click "🔄 Deploy Phase Change"**
3. **Phase updates live** for Zebediah

---

## **🔍 Testing**

### **Test the System**
1. Make a small status change
2. Click deploy button
3. Check GitHub Actions tab for workflow
4. Wait for Vercel deployment
5. Verify changes on live status page

### **Monitor Deployments**
- **GitHub Actions**: Check workflow runs
- **Vercel Dashboard**: Monitor deployments
- **Live Status Page**: Verify updates appear

---

## **🚨 Troubleshooting**

### **Common Issues**

#### **"Deployment failed" Error**
- Check GitHub token permissions
- Verify repository access
- Check GitHub Actions workflow file

#### **Changes Not Appearing**
- Wait 2-3 minutes for deployment
- Check Vercel deployment logs
- Verify GitHub Actions completed

#### **API Endpoint Not Found**
- Ensure `/api/status-update.js` exists
- Check Vercel function deployment
- Verify API route configuration

### **Debug Steps**
1. **Check browser console** for errors
2. **Verify GitHub token** has correct permissions
3. **Check GitHub Actions** workflow runs
4. **Monitor Vercel deployment** logs
5. **Test API endpoint** directly

---

## **🎉 Success Indicators**

✅ **GitHub Actions workflow runs** when you click deploy  
✅ **Files are committed** with status updates  
✅ **Vercel deploys** automatically  
✅ **Zebediah sees changes** on live status page  
✅ **No manual git commands** needed  

---

## **🔮 Future Enhancements**

- **Email notifications** when updates deploy
- **Slack/Discord integration** for team updates
- **Status update templates** for common updates
- **Automated milestone triggers**
- **Client feedback integration**

---

## **📞 Support**

If you encounter issues:
1. Check this troubleshooting guide
2. Review GitHub Actions logs
3. Check Vercel deployment status
4. Verify environment variables
5. Test API endpoint manually

**The system is designed to be bulletproof - once set up, it should work seamlessly!** 🚀
