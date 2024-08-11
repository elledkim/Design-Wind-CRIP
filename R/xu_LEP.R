xu_LEP <- function(test_value,lat,long,sigma,xi,u,lambda,NTC_coeff){
  xi[xi==0]=-0.00000001
  m = length(sigma)
    p_TC = prod(exp(-lambda*(1+xi/sigma*(test_value-u))^(-1/xi)), na.rm = TRUE)
    p_NTC = (exp(-exp(-(test_value-NTC_coeff[1])/NTC_coeff[2])))^m
    p = 1-p_NTC*p_TC
    if (p < 0)
      p = 1
  aep = p_NTC*p_TC
  #print("AEP:")
  #print(aep)
  return(p)
}