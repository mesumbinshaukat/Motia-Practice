import { ApiRouteConfig } from "motia"

export const config : ApiRouteConfig = {
    name: "SubmitChannel",
    type: "api",
    path: "/submit",
    method: "POST",
    emits: ["yt.submit"]
};

interface SubmitRequest {
    channel: string,
    email: string
};

export const handler = async (req: any, {emit, logger, state}:any) => {
    try {

        logger.info("Received Submission Request", {body: req.body});
        const {channel, email} = req.body as SubmitRequest
        
        if (!channel || !email){
            return {
                status: 500,
                body: {
                    error: "Missing required channel name and email"
                }
            }
        }

        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

        if(!emailRegex.test(email)){
            return {
                status: 400,
                body: {
                    error: "Invalid email"
                }
            }
        }

        const jobId = `job_${Date.now()}_${Math.random().toString().substring(2,9)}`;

        await state.set(`job: ${jobId}`, {
            jobId,
            channel,
            email,
            status: "queued",
            createdAt: new Date().toISOString()
        });

        logger.info("Job Created: ", {jobId, channel, email})

        await emit({
            topic: "yt.submit",
            data: {
                jobId,
                channel,
                email
            }
        })

        return {
            status: 202,
            body: {
                success: true,
                jobId,
                message: "Your request has been queued. You will get an email with improved suggestions for you yt videos."
            }
        }

    } catch (error:any) {
        logger.error('Error in submission handler', {error: error.message});
        return {
            status: 500,
            body: {
                error: "Internal Server Error"
            }
        }
    }

}
